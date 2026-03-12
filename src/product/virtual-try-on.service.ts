import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import axios from 'axios';
import { randomUUID } from 'crypto';

const MAX_PIXELS = 4194304; // 4 megapixels

@Injectable()
export class VirtualTryOnService {
  private bedrockClient: BedrockRuntimeClient;
  private s3Client: S3Client;
  private readonly bucketName = 'furnfitdemo';

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
    this.s3Client = new S3Client({ region: 'us-east-1' }); // Adjust region if needed
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  private async resizeIfNeeded(
    imageBuffer: Buffer,
    maxPixels = MAX_PIXELS,
  ): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const currentPixels = width * height;

    if (currentPixels <= maxPixels) {
      return imageBuffer;
    }

    const scale = Math.sqrt(maxPixels / currentPixels);
    const newWidth = Math.floor(width * scale);
    const newHeight = Math.floor(height * scale);

    return sharp(imageBuffer)
      .resize(newWidth, newHeight, { fit: 'inside' })
      .toBuffer();
  }

  private async encodeImage(imageBuffer: Buffer): Promise<string> {
    const resizedBuffer = await this.resizeIfNeeded(imageBuffer);

    // Convert to JPEG with white background for transparency
    const jpegBuffer = await sharp(resizedBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 95 })
      .toBuffer();

    return jpegBuffer.toString('base64');
  }

  private async uploadToS3(
    imageBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: imageBuffer,
      ContentType: 'image/png',
    });

    await this.s3Client.send(command);

    // Return public URL
    return `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
  }

  async virtualTryOn(
    sourceImageUrl: string,
    garmentImageUrl: string,
    garmentClass: 'UPPER_BODY' | 'LOWER_BODY' | 'FULL_BODY' = 'UPPER_BODY',
  ): Promise<{ resultUrl: string }> {
    try {
      // 1. Download both images
      const [sourceBuffer, garmentBuffer] = await Promise.all([
        this.downloadImage(sourceImageUrl),
        this.downloadImage(garmentImageUrl),
      ]);

      // 2. Encode images to base64
      const [sourceImg, garmentImg] = await Promise.all([
        this.encodeImage(sourceBuffer),
        this.encodeImage(garmentBuffer),
      ]);

      // 3. Prepare Nova Canvas request
      const nativeRequest = {
        taskType: 'VIRTUAL_TRY_ON',
        virtualTryOnParams: {
          sourceImage: sourceImg,
          referenceImage: garmentImg,
          maskType: 'GARMENT',
          garmentBasedMask: {
            garmentClass,
          },
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: 'standard',
        },
      };

      // 4. Call Amazon Nova Canvas
      const command = new InvokeModelCommand({
        modelId: 'amazon.nova-canvas-v1:0',
        body: JSON.stringify(nativeRequest),
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (responseBody.error) {
        throw new HttpException(
          `Nova API error: ${responseBody.error}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 5. Decode result image
      const resultImageBuffer = Buffer.from(responseBody.images[0], 'base64');

      // 6. Upload to S3
      const filename = `try-on/${randomUUID()}.png`;
      const resultUrl = await this.uploadToS3(resultImageBuffer, filename);

      return { resultUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Virtual try-on failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
