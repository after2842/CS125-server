import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { ConflictException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
  ) {}
  async retrieveIG(query: any) {
    // const data = [
    //   {
    //     id: '3279789873060150493',
    //     type: 'Sidecar',
    //     shortCode: 'C2EJ4MxrHzd',
    //     caption: '🧸🎀',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/C2EJ4MxrHzd/',
    //     commentsCount: 3,
    //     firstComment: '언니 예뽀요 .. 💘',
    //     latestComments: [[Object], [Object], [Object]],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/419038862_1285090205493745_8943968534583410590_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QGHC6wKzjzw1lrtI-9nA_QIUlIGvP_J12uVKNwUO3uEuv_O4a2clMAeBhVZDFwXTpA&_nc_ohc=u17BghOvIZQQ7kNvwHk65lP&_nc_gid=9rbgDTpE1dGMd8xbMZYlMA&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsDvoDLI5ZVBJ_gTUTeJapQIbmLZaxtgUJXngyu57MaQg&oe=69A54D42&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/419038862_1285090205493745_8943968534583410590_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QGHC6wKzjzw1lrtI-9nA_QIUlIGvP_J12uVKNwUO3uEuv_O4a2clMAeBhVZDFwXTpA&_nc_ohc=u17BghOvIZQQ7kNvwHk65lP&_nc_gid=9rbgDTpE1dGMd8xbMZYlMA&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsDvoDLI5ZVBJ_gTUTeJapQIbmLZaxtgUJXngyu57MaQg&oe=69A54D42&_nc_sid=10d13b',
    //       'https://scontent-iad3-2.cdninstagram.com/v/t51.29350-15/418673453_370854348974117_7524873720903450196_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=105&_nc_oc=Q6cZ2QGHC6wKzjzw1lrtI-9nA_QIUlIGvP_J12uVKNwUO3uEuv_O4a2clMAeBhVZDFwXTpA&_nc_ohc=HsUMRypIpk8Q7kNvwFpOU4W&_nc_gid=9rbgDTpE1dGMd8xbMZYlMA&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afs6ava4O4CYq9GI63OCF-JfgPvSbY8G4xj717w6oQIV4Q&oe=69A55820&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on January 13, 2024.',
    //     likesCount: -1,
    //     timestamp: '2024-01-14T03:04:02.000Z',
    //     childPosts: [[Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3414672190854148837',
    //     type: 'Sidecar',
    //     shortCode: 'C9jWkQQRDLl',
    //     caption: 'tbt summer 2022 🙌🏻🧚🏻‍♀️',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/C9jWkQQRDLl/',
    //     commentsCount: 6,
    //     firstComment: '해맑은 명이가 젤로 예뿌 🫧🩵',
    //     latestComments: [[Object], [Object], [Object], [Object], [Object]],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-ord5-3.cdninstagram.com/v/t51.29350-15/451549880_3307250952905251_4951776958394488573_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-3.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=6NVLQkJv3EQQ7kNvwGPirrP&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvLLfCJXwEZaVxs3_tOPkPiTXSG72a8o02wOnx9fPhckg&oe=69A552FC&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-ord5-3.cdninstagram.com/v/t51.29350-15/451549880_3307250952905251_4951776958394488573_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-3.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=6NVLQkJv3EQQ7kNvwGPirrP&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvLLfCJXwEZaVxs3_tOPkPiTXSG72a8o02wOnx9fPhckg&oe=69A552FC&_nc_sid=10d13b',
    //       'https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/451826647_831644328910012_669346606363402412_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=4qUqW_BAF6AQ7kNvwF7AX72&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftU-foljkyYUeHdWGx8d_jrUgtV1YFElY5zQ9-eAcVCag&oe=69A56957&_nc_sid=10d13b',
    //       'https://scontent-ord5-3.cdninstagram.com/v/t51.29350-15/451410525_1181117093204256_3628043958429166894_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-3.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=oF93PyRL8QsQ7kNvwH3j9P7&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afv5RZyeNvorcTiBD1mJum1EmDyaAdIJ4lELMLa_HNZsTg&oe=69A5422F&_nc_sid=10d13b',
    //       'https://scontent-ord5-2.cdninstagram.com/v/t51.29350-15/451407910_842276354160723_7060765472888720294_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=sQ4maxfYpPUQ7kNvwHh4O-Z&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsKCAF777RnaG7NTpfmzqV2mGl-9bIWhb1b7g9B_6FquA&oe=69A568F7&_nc_sid=10d13b',
    //       'https://scontent-ord5-1.cdninstagram.com/v/t51.29350-15/451550486_2795371380640379_8538810740107607725_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=111&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=jll9zXzbzsEQ7kNvwEvQVqH&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfshLTDMBYaYBgt8rU5dtirmaSsVZXg6cgdWtIvXhjCcEQ&oe=69A554C8&_nc_sid=10d13b',
    //       'https://scontent-ord5-3.cdninstagram.com/v/t51.29350-15/451557771_1409203066461319_408412497573453961_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-3.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2QE_wmk7AWL6C3eVJZ-rUwhWU4Vn-qIFKnhYvOAJ7bnnWaqnc7Er7eSBmGMF_GLOrYE&_nc_ohc=HSYT0sdJI3EQ7kNvwFjzT54&_nc_gid=0NreQy7asSjjPXe0IdzQ5Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvuQrP4npX0Ou3tzkO0Fd7vA5gUEdCYHuKcP9aRM0rqJQ&oe=69A54E2C&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on July 17, 2024.',
    //     likesCount: -1,
    //     timestamp: '2024-07-18T05:31:07.000Z',
    //     childPosts: [
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //     ],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3772318156661266127',
    //     type: 'Sidecar',
    //     shortCode: 'DRZ92B7jRbP',
    //     caption: 'tokyo! ✈️🗼',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/DRZ92B7jRbP/',
    //     commentsCount: 4,
    //     firstComment: '♥️__♥️',
    //     latestComments: [[Object], [Object], [Object], [Object]],
    //     dimensionsHeight: 1440,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-dfw5-1.cdninstagram.com/v/t51.82787-15/587851516_18542232613026598_3811087048917990709_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-dfw5-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QEN2M71wbKbmMiiXD3Wd4JdP_mdo5e7C7JVKcatuM2h2wsHqpZBCQz1IxVF5Zd3DsM&_nc_ohc=X4w4HBymX3gQ7kNvwGNr2eg&_nc_gid=wIwiGDIMDuDTuy4Xwl1rbw&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftJ8MvY0XVlhBafGxoSoCYgzIkjQOwGSIAvQh9hWgJSQg&oe=69A54540&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-dfw5-1.cdninstagram.com/v/t51.82787-15/587851516_18542232613026598_3811087048917990709_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-dfw5-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QEN2M71wbKbmMiiXD3Wd4JdP_mdo5e7C7JVKcatuM2h2wsHqpZBCQz1IxVF5Zd3DsM&_nc_ohc=X4w4HBymX3gQ7kNvwGNr2eg&_nc_gid=wIwiGDIMDuDTuy4Xwl1rbw&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftJ8MvY0XVlhBafGxoSoCYgzIkjQOwGSIAvQh9hWgJSQg&oe=69A54540&_nc_sid=10d13b',
    //       'https://scontent-dfw5-1.cdninstagram.com/v/t51.82787-15/587609779_18542232622026598_1746689946364255089_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-dfw5-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QEN2M71wbKbmMiiXD3Wd4JdP_mdo5e7C7JVKcatuM2h2wsHqpZBCQz1IxVF5Zd3DsM&_nc_ohc=IPCZXMBBaqYQ7kNvwFNDBKM&_nc_gid=wIwiGDIMDuDTuy4Xwl1rbw&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfuHT782p4Wn29PeZV3mwIXbsdPbOPzOcqXY6W9i0jk8Pg&oe=69A5580E&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on November 23, 2025.',
    //     likesCount: -1,
    //     timestamp: '2025-11-23T16:29:49.000Z',
    //     childPosts: [[Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3448687441278832441',
    //     type: 'Sidecar',
    //     shortCode: 'C_cMvS2xo85',
    //     caption: '졸업 해도 계속 공부 📚💦',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/C_cMvS2xo85/',
    //     commentsCount: 2,
    //     firstComment: '홧팅 마이 럽 💗💗',
    //     latestComments: [[Object], [Object]],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-ord5-1.cdninstagram.com/v/t51.29350-15/457144454_3966595733568707_5400859431523945803_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=111&_nc_oc=Q6cZ2QEtiBzP_9Qb4dE0y89KbAgsZrCWY-I7qawGc_6xJOiFpkZZmmdYU8FpXT6vxjWC4oQ&_nc_ohc=kAHSPltPCTIQ7kNvwEQJdL5&_nc_gid=Bp1KGhIgqxv4Jz2KkGXyIQ&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afst_j0HgJQJh3tgPy9SWfkvms5yTu4gjh4IWwHsH68qbA&oe=69A54C02&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-ord5-1.cdninstagram.com/v/t51.29350-15/457144454_3966595733568707_5400859431523945803_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=111&_nc_oc=Q6cZ2QEtiBzP_9Qb4dE0y89KbAgsZrCWY-I7qawGc_6xJOiFpkZZmmdYU8FpXT6vxjWC4oQ&_nc_ohc=kAHSPltPCTIQ7kNvwEQJdL5&_nc_gid=Bp1KGhIgqxv4Jz2KkGXyIQ&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afst_j0HgJQJh3tgPy9SWfkvms5yTu4gjh4IWwHsH68qbA&oe=69A54C02&_nc_sid=10d13b',
    //       'https://scontent-ord5-1.cdninstagram.com/v/t51.29350-15/457865340_1065746461858664_7685103729394347575_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QEtiBzP_9Qb4dE0y89KbAgsZrCWY-I7qawGc_6xJOiFpkZZmmdYU8FpXT6vxjWC4oQ&_nc_ohc=dj4CL2afoSgQ7kNvwHYeK7U&_nc_gid=Bp1KGhIgqxv4Jz2KkGXyIQ&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afu-fm_Y05EjxI0i0hjWnQYgoqCRMq15z1nlJmyKbAxd-g&oe=69A54BAB&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on September 02, 2024.',
    //     likesCount: -1,
    //     timestamp: '2024-09-03T03:53:21.000Z',
    //     childPosts: [[Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3363226109058051201',
    //     type: 'Sidecar',
    //     shortCode: 'C6slFO5uWyB',
    //     caption: '🩶',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/C6slFO5uWyB/',
    //     commentsCount: 1,
    //     firstComment: '차도녀인가여~~? 🩶',
    //     latestComments: [[Object]],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/442448491_426839463381829_1129720333976095032_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QE5LK2Zu1HRZvYb6ib-PcpUU2Feo3I5-e1DnznusCwUBaDqroRbgMOUVkkkNmaqQ1Y&_nc_ohc=TpuDATyb_K4Q7kNvwEChB-c&_nc_gid=EvqHb6NNrTJPeaB0hXsZCg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvjegNOs5dkPxUZvtr3T4L4vEULaivSDm19dyBmF8OXIQ&oe=69A55E21&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/442448491_426839463381829_1129720333976095032_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QE5LK2Zu1HRZvYb6ib-PcpUU2Feo3I5-e1DnznusCwUBaDqroRbgMOUVkkkNmaqQ1Y&_nc_ohc=TpuDATyb_K4Q7kNvwEChB-c&_nc_gid=EvqHb6NNrTJPeaB0hXsZCg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvjegNOs5dkPxUZvtr3T4L4vEULaivSDm19dyBmF8OXIQ&oe=69A55E21&_nc_sid=10d13b',
    //       'https://scontent-iad3-2.cdninstagram.com/v/t51.29350-15/442437232_456517306876491_2919868826871880814_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2QE5LK2Zu1HRZvYb6ib-PcpUU2Feo3I5-e1DnznusCwUBaDqroRbgMOUVkkkNmaqQ1Y&_nc_ohc=BQrlFpsps28Q7kNvwFH__Dq&_nc_gid=EvqHb6NNrTJPeaB0hXsZCg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfuZn4ywIHWYI7SHwyrwGi_4p2RJ2ch-tRnWKWWJiqck3g&oe=69A5786A&_nc_sid=10d13b',
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/442262665_969541034365993_5415351874903901871_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QE5LK2Zu1HRZvYb6ib-PcpUU2Feo3I5-e1DnznusCwUBaDqroRbgMOUVkkkNmaqQ1Y&_nc_ohc=t3KSdOolyN8Q7kNvwGpj4bo&_nc_gid=EvqHb6NNrTJPeaB0hXsZCg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afup_1e9lDHFAWHaoCpE2NXgORwtTtPQW0qdXtu4tOb-kw&oe=69A574DB&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on May 07, 2024.',
    //     likesCount: -1,
    //     timestamp: '2024-05-08T05:56:56.000Z',
    //     childPosts: [[Object], [Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3589745437299060899',
    //     type: 'Sidecar',
    //     shortCode: 'DHRVnS4SjCj',
    //     caption: '우리의 생일을 축하해 🎂🎁♥️',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/DHRVnS4SjCj/',
    //     commentsCount: 27,
    //     firstComment: '🤭🎉🎊🎂',
    //     latestComments: [
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //     ],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/484970664_18495165751059304_5432022824773192214_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=AUGutFI0tn8Q7kNvwEKZyyP&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvyRYabiOPryFdPjM4RiV9mCvYiW63Uia4ceQw8Y0Ox8g&oe=69A56E55&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/484970664_18495165751059304_5432022824773192214_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=AUGutFI0tn8Q7kNvwEKZyyP&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvyRYabiOPryFdPjM4RiV9mCvYiW63Uia4ceQw8Y0Ox8g&oe=69A56E55&_nc_sid=10d13b',
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/485181115_18495165760059304_3886042079540777657_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=-afZAV_u9LIQ7kNvwEJhwEU&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Aft5QPwcN9LPjzJD_KYJNcaPOjm7RF2eirkDN0tRzbhNDA&oe=69A5680B&_nc_sid=10d13b',
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/485005569_18495165769059304_8051192988607112161_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=wZppQ0KES1EQ7kNvwH2lCTv&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvpMQFfNJZpV8qQm5NOSTm9BxkouNFAwghR476T7X9Pxw&oe=69A5442B&_nc_sid=10d13b',
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/484617751_18495165778059304_4448353992141523745_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=O0UiLqCLTM4Q7kNvwFYG7na&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsuqPbjskFFf6jDYOpUrD54dsiDK61fA8bJFW6UW0gkww&oe=69A578F6&_nc_sid=10d13b',
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/484801529_18495165787059304_3627065658650639204_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=sgsxrg_MixMQ7kNvwFDUlOQ&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afvi-rmOoov70HOt81tHhyh9ZySWJYMbGbTvfjgxhlQ61w&oe=69A55702&_nc_sid=10d13b',
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/485085636_18495165799059304_7347603540111607718_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=CeO4KqchUQ0Q7kNvwEuR3MT&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftsWOAnneY6z5Rzb9fw_6dYAoFGnhoy0J3pmbyGPJM6UQ&oe=69A5588F&_nc_sid=10d13b',
    //       'https://scontent-lax3-1.cdninstagram.com/v/t51.2885-15/484816670_18495165808059304_1797775988764916495_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-lax3-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QGWG8VvZkzrMgkWfww_tgyQLQXlOyqFp5jJD3rEcHfVOmaCM-1BDEPiQ5e5RWgFYCboGiNllMIvptGjWoA1dcQY&_nc_ohc=oXDAwlkvkmEQ7kNvwEBD-gH&_nc_gid=vhUF7ncf4BHYIf-T_XWbfg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Aft76tQ8ZxEehASDeuLPK1dramms0BLFaqJrqZXxXVm7lA&oe=69A5639C&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo shared by @3ll3l6 on March 16, 2025 tagging @el0lse.',
    //     likesCount: -1,
    //     timestamp: '2025-03-16T18:50:24.000Z',
    //     childPosts: [
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //     ],
    //     ownerUsername: '3ll3l6',
    //     ownerId: '1147515303',
    //     taggedUsers: [[Object]],
    //     coauthorProducers: [[Object]],
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //     ownerFullName: '',
    //   },
    //   {
    //     id: '3378449854580283977',
    //     type: 'Sidecar',
    //     shortCode: 'C7iqj4xulpJ',
    //     caption: 'my 2nd japan trip 🌸🫶🏻',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/C7iqj4xulpJ/',
    //     commentsCount: 3,
    //     firstComment: '일본 여행 잘 누려보세요. 👏👏👏',
    //     latestComments: [[Object], [Object], [Object]],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446528179_312728095104316_6112147950921317776_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=3rXlSMejUdwQ7kNvwGpBrZw&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvSaEdnrt150VcWA5yA1LGqfUhVa5ZtoozVrn6XtbKLzg&oe=69A545E3&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446528179_312728095104316_6112147950921317776_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=3rXlSMejUdwQ7kNvwGpBrZw&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvSaEdnrt150VcWA5yA1LGqfUhVa5ZtoozVrn6XtbKLzg&oe=69A545E3&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446237113_972933304370259_3646746452582530123_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=103&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=7m3LGdtSUFoQ7kNvwHQ5S97&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftoOCtovIUswuRxC_r-bEtXZG7DtfP4iggRFfUIbjZWig&oe=69A55B19&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446507618_942506650949524_309974887790470632_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=104&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=vTyMIVAVLvIQ7kNvwFJ2628&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afv8AW6sersDxa5BC_AbnP_QtUIGdPbhcsAk5Gx2IiXahw&oe=69A575AD&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446560899_763476942661596_8833157243314629583_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=U3PYyMmWtkIQ7kNvwHOowne&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvEBrdF6MEHyCFOjDztCwh2A_TE_iN70EDWBhxg_fUjRg&oe=69A54B9F&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446346784_1585362862311450_5406634115956581008_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=3quPzqfeQhEQ7kNvwH-MebQ&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftQVFaQymcDvqi6z1ZqZyvB1EQYYtepVkxucOiFNKA8cw&oe=69A57094&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446508479_1053291862827222_6312923767420243169_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=sWkkdofuTI0Q7kNvwFSxDLs&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Aft55FmIF66icRmnTQaYW9wAjHd9j4uUVNhLYlftOW8e7A&oe=69A56132&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446240844_2127413104300952_2262555577072778817_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=RP0wNoMBqbcQ7kNvwFVYSV1&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AftC1x-n8HwPkki4jUpZm_bp3-3j3n28p0vA_ni2UVCDJw&oe=69A5706F&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446527833_7608653599231302_6007920206371100635_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=qmXIdqvO4lAQ7kNvwFdBsq2&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfuvAat9_eEF4NsaNS2jq_M6BXSNtmWoxRFNP-jSu1n9fQ&oe=69A5451E&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446249270_1019540739523304_1671735999313020364_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=UYunfvRKmmYQ7kNvwFbSszJ&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsV4S5r6eYJEkz1rSRDs5LCdcOJG3p3Lv3siB7774sJTA&oe=69A5573A&_nc_sid=10d13b',
    //       'https://scontent-det1-1.cdninstagram.com/v/t51.29350-15/446249100_426226216881223_1211169324670693109_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-det1-1.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2QFXIkjMW_0TMu7yk-AUOexnNDpcc_E1IV0QbdW29VMC1LcfFvK-P9Mo6fKWQwl-WBo&_nc_ohc=1DvsqaQIiPkQ7kNvwEAC5ES&_nc_gid=D9P-3yyIL4N8FG-vPqFTqg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsabCK84hI4tYxtvgwgaex28V-jMpUM5wKrz3cqYSb6xQ&oe=69A55114&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on May 28, 2024.',
    //     likesCount: -1,
    //     timestamp: '2024-05-29T06:03:48.000Z',
    //     childPosts: [
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //       [Object],
    //     ],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3642194692541959616',
    //     type: 'Sidecar',
    //     shortCode: 'DKLrMaTxs3A',
    //     caption: '🌳🖤',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/DKLrMaTxs3A/',
    //     commentsCount: 1,
    //     firstComment: '아이고 예뽀라 🖤',
    //     latestComments: [[Object]],
    //     dimensionsHeight: 1349,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/502084505_18505453234026598_2181335027369224133_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QG97FQksmB-0uGL23kC3vIfnv38yq6C9AL6FE-1t7F88hw5HKxVpnicDcl2nMfq4-w&_nc_ohc=gfQv2pqNkScQ7kNvwFvia5B&_nc_gid=jo_3iaLT5InlDH7oqLyAZw&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsJWn3om9XmqemdHDzQV5A38BSAVRyqgbY_9bbBrMUTsw&oe=69A572FA&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/502084505_18505453234026598_2181335027369224133_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QG97FQksmB-0uGL23kC3vIfnv38yq6C9AL6FE-1t7F88hw5HKxVpnicDcl2nMfq4-w&_nc_ohc=gfQv2pqNkScQ7kNvwFvia5B&_nc_gid=jo_3iaLT5InlDH7oqLyAZw&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsJWn3om9XmqemdHDzQV5A38BSAVRyqgbY_9bbBrMUTsw&oe=69A572FA&_nc_sid=10d13b',
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/501439741_18505453243026598_1600917607327931746_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=110&_nc_oc=Q6cZ2QG97FQksmB-0uGL23kC3vIfnv38yq6C9AL6FE-1t7F88hw5HKxVpnicDcl2nMfq4-w&_nc_ohc=VP94WnRCOBsQ7kNvwFYqY_9&_nc_gid=jo_3iaLT5InlDH7oqLyAZw&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfspCZPxz9zVRcYzDxhIg-ygxZsT4hJwA5DiQj8tZtO4cQ&oe=69A56C22&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on May 27, 2025.',
    //     likesCount: -1,
    //     timestamp: '2025-05-28T03:37:43.000Z',
    //     childPosts: [[Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3150850247911000582',
    //     type: 'Sidecar',
    //     shortCode: 'Cu6EZtHL8oG',
    //     caption: '💌 🎨',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/Cu6EZtHL8oG/',
    //     commentsCount: 4,
    //     firstComment: '귀여워여 🥰',
    //     latestComments: [[Object], [Object], [Object], [Object]],
    //     dimensionsHeight: 1349,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-mia3-2.cdninstagram.com/v/t51.29350-15/361562153_657546552909835_3352918771793482696_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-mia3-2.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2QGfrVtIaJgNPwNJ1mLh-CxprNwrsgZQ3r_NSiYtjNXTiv30oMKmojxHmjkh2nDfB-Fg2B361haA5o0aItTMIxXu&_nc_ohc=KCzKj1sF0j8Q7kNvwEiqjPe&_nc_gid=G3cGcv6e6alEyxMyxTmVWg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvYyKJ0W1r1swEGvBJ27pjnX0Ce2jezTGZxzdLrNS2P3Q&oe=69A55E8F&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-mia3-2.cdninstagram.com/v/t51.29350-15/361562153_657546552909835_3352918771793482696_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-mia3-2.cdninstagram.com&_nc_cat=107&_nc_oc=Q6cZ2QGfrVtIaJgNPwNJ1mLh-CxprNwrsgZQ3r_NSiYtjNXTiv30oMKmojxHmjkh2nDfB-Fg2B361haA5o0aItTMIxXu&_nc_ohc=KCzKj1sF0j8Q7kNvwEiqjPe&_nc_gid=G3cGcv6e6alEyxMyxTmVWg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvYyKJ0W1r1swEGvBJ27pjnX0Ce2jezTGZxzdLrNS2P3Q&oe=69A55E8F&_nc_sid=10d13b',
    //       'https://scontent-mia5-1.cdninstagram.com/v/t51.29350-15/362017735_680437627237957_5172549856728936861_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-mia5-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QGfrVtIaJgNPwNJ1mLh-CxprNwrsgZQ3r_NSiYtjNXTiv30oMKmojxHmjkh2nDfB-Fg2B361haA5o0aItTMIxXu&_nc_ohc=i6eGySjYIq0Q7kNvwGgg_Us&_nc_gid=G3cGcv6e6alEyxMyxTmVWg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfvMS4GfnaEHcYgr2Im8_QOatCw9BIFLFG5bR0I-j3jxrw&oe=69A56646&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on July 19, 2023.',
    //     likesCount: -1,
    //     timestamp: '2023-07-20T05:24:01.000Z',
    //     childPosts: [[Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    //   {
    //     id: '3531145782781485716',
    //     type: 'Sidecar',
    //     shortCode: 'DEBJmFwzyKU',
    //     caption: 'merry christmas 🎄🎅🏻♥️',
    //     hashtags: [],
    //     mentions: [],
    //     url: 'https://www.instagram.com/p/DEBJmFwzyKU/',
    //     commentsCount: 4,
    //     firstComment: '예쁜 명이언닝',
    //     latestComments: [[Object], [Object], [Object], [Object]],
    //     dimensionsHeight: 1350,
    //     dimensionsWidth: 1080,
    //     displayUrl:
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/471830484_1270414780750688_8141905175614834046_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QFxf-FkZk9U_2HGS79qWLHweZ5Lxk6txej2Vri5KkjjN2i3i9ZfwYdJeUlNxMmbu6c&_nc_ohc=Y1Mavs3IxS0Q7kNvwFXaEEm&_nc_gid=IsgNe3pR5vLXX9lDkNO2Wg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afsk7RGkTmSzO1ZqoAru8GiIoECrlS5rG5F2u7Amz_2KTA&oe=69A55DC9&_nc_sid=10d13b',
    //     images: [
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/471830484_1270414780750688_8141905175614834046_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QFxf-FkZk9U_2HGS79qWLHweZ5Lxk6txej2Vri5KkjjN2i3i9ZfwYdJeUlNxMmbu6c&_nc_ohc=Y1Mavs3IxS0Q7kNvwFXaEEm&_nc_gid=IsgNe3pR5vLXX9lDkNO2Wg&edm=APs17CUBAAAA&ccb=7-5&oh=00_Afsk7RGkTmSzO1ZqoAru8GiIoECrlS5rG5F2u7Amz_2KTA&oe=69A55DC9&_nc_sid=10d13b',
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/471660303_1540724619974113_6682068999217882024_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QFxf-FkZk9U_2HGS79qWLHweZ5Lxk6txej2Vri5KkjjN2i3i9ZfwYdJeUlNxMmbu6c&_nc_ohc=OsHk1MXsvWUQ7kNvwGTWlRn&_nc_gid=IsgNe3pR5vLXX9lDkNO2Wg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfuGeRcfTGFvtDy6AMNapVb419EEyvETXZhFW0XnPjdcCA&oe=69A566C7&_nc_sid=10d13b',
    //       'https://scontent-iad3-1.cdninstagram.com/v/t51.29350-15/471594513_585418284124309_1519757373050765883_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2QFxf-FkZk9U_2HGS79qWLHweZ5Lxk6txej2Vri5KkjjN2i3i9ZfwYdJeUlNxMmbu6c&_nc_ohc=xeu-W2aNhQgQ7kNvwGfsmJu&_nc_gid=IsgNe3pR5vLXX9lDkNO2Wg&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfsWsaB179-g52sx7m9EyqeDlSCy0wjCRy5SIPYDGgCHMw&oe=69A545F5&_nc_sid=10d13b',
    //     ],
    //     alt: 'Photo by eloise 명 on December 25, 2024.',
    //     likesCount: -1,
    //     timestamp: '2024-12-25T22:23:21.000Z',
    //     childPosts: [[Object], [Object], [Object]],
    //     ownerFullName: 'eloise 명',
    //     ownerUsername: 'el0lse',
    //     ownerId: '1433114597',
    //     isCommentsDisabled: false,
    //     inputUrl: 'https://www.instagram.com/el0lse/',
    //   },
    // ];
    // const fake = {
    //   username: 'unknown_username',
    //   summary:
    //     'Photos show a polished, mostly-neutral wardrobe with a soft-feminine baseline (flowy dresses, pleats, scrunchies) balanced by minimal, modern pieces (clean black tops, denim, structured bags). The account also mixes casual street elements (chunky/platform shoes, sneakers) and frequent travel/cafe backdrops — overall a refined everyday / travel-focused aesthetic.',
    //   aesthetic_archetypes: [
    //     {
    //       label: 'minimal_chic',
    //       score: 0.9,
    //       confidence: 0.85,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'soft_feminine',
    //       score: 0.86,
    //       confidence: 0.8,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'casual_streetwear',
    //       score: 0.6,
    //       confidence: 0.7,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'preppy_korean',
    //       score: 0.48,
    //       confidence: 0.6,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'travel_influenced',
    //       score: 0.8,
    //       confidence: 0.85,
    //       evidence_refs: [Array],
    //     },
    //   ],
    //   lifestyle_and_occasion: [
    //     {
    //       label: 'cafe_work_study',
    //       score: 0.8,
    //       confidence: 0.8,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'travel_city_sightseeing',
    //       score: 0.85,
    //       confidence: 0.9,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'beach_getaway',
    //       score: 0.78,
    //       confidence: 0.78,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'casual_evening_out',
    //       score: 0.6,
    //       confidence: 0.65,
    //       evidence_refs: [Array],
    //     },
    //   ],
    //   color_and_pattern_affinity: [
    //     {
    //       label: 'neutral_black_and_dark_tones',
    //       score: 0.92,
    //       confidence: 0.9,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'soft_pastels_and_light_pinks',
    //       score: 0.65,
    //       confidence: 0.7,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'gray_to_silver_hair_ombre',
    //       score: 0.88,
    //       confidence: 0.9,
    //       evidence_refs: [Array],
    //     },
    //     {
    //       label: 'white_and_small_floral_patterns',
    //       score: 0.6,
    //       confidence: 0.7,
    //       evidence_refs: [Array],
    //     },
    //   ],
    //   evidence_index: [
    //     {
    //       post_shortcode: 'C2EJ4MxrHzd',
    //       excerpt:
    //         'Black off-shoulder top + gingham chair background; clean neutral outfit.',
    //     },
    //     {
    //       post_shortcode: 'C9jWkQQRDLl',
    //       excerpt:
    //         'Black fitted top with pale pleated skirt among trees — soft feminine travel shot.',
    //     },
    //     {
    //       post_shortcode: 'Cu6EZtHL8oG',
    //       excerpt:
    //         'Side-by-side beach portraits in matching white dresses (coordinated, feminine).',
    //     },
    //     {
    //       post_shortcode: 'C7iqj4xulpJ',
    //       excerpt:
    //         'Street photo wearing black pleated skirt, socks + platform shoes — casual/street mix.',
    //     },
    //     {
    //       post_shortcode: 'C_cMvS2xo85',
    //       excerpt:
    //         'Salon/mirror shots showing gray/ash ombré hair and simple, minimal outfit.',
    //     },
    //     {
    //       post_shortcode: 'C6slFO5uWyB',
    //       excerpt:
    //         'Mirror selfie in pale blouse and tie; small jewellery — preppy/clean details.',
    //     },
    //     {
    //       post_shortcode: 'DKLrMaTxs3A',
    //       excerpt:
    //         'Beach photoshoot series with flowy white dresses and floral accents.',
    //     },
    //     {
    //       post_shortcode: 'DEBJmFwzyKU',
    //       excerpt:
    //         'Multiple Tokyo Tower / city frames with long coat, layered looks and evening shots.',
    //     },
    //     {
    //       post_shortcode: 'DRZ92B7jRbP',
    //       excerpt:
    //         'Casual city travel shots and candid night photos; neutral outerwear present.',
    //     },
    //     {
    //       post_shortcode: 'DHRVnS4SjCj',
    //       excerpt:
    //         'Casual cafe / dessert photos with small accessories (headband, plush armband).',
    //     },
    //   ],
    //   overall_confidence: 0.78,
    //   missing_data: [
    //     'Captions, hashtags or explicit brand tags (would confirm specific brands or influences).',
    //     'Higher-resolution pixel color analysis / palette extraction (used only visual inspection).',
    //     'Post frequency and engagement metrics to confirm signature looks vs one-off outfits.',
    //     'Tagged-stylist or shopping links to verify recurring brands returned in wardrobe.',
    //   ],
    // };

    console.log('retrieve IG called', query?.usrname);
    const usrId = query?.usrname;
    const TOKEN = process.env.APIFY_TOKEN;
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${TOKEN}&wait=60`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${usrId}/`],
          resultsLimit: 10,
        }),
      },
    );

    const data = await response.json();
    const res = await this.analyzeStyle(data);
    console.log(res);

    return res;
  }
  async analyzeStyle(posts: any) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_APIKEY });
    let globalImageIndex = 0;
    const imageMetaData = posts
      .flatMap((post, postIdx) =>
        post.images.map((img) => {
          const metadata = `Image ${globalImageIndex}'s metadata: \nID: ${post.id} \nshortCode ${post.shortCode} \nPostedTime: ${post.timestamp}\n\n`;
          globalImageIndex++;
          return metadata;
        }),
      )
      .join('');
    const images = posts.flatMap((post) => post.images);
    const imageObjects = images.map((url) => ({
      type: 'input_image',
      image_url: url,
    }));
    // 1) Define a small, robust schema
    const Score01 = z
      .number()
      .min(0)
      .max(1)
      .describe('A score from 0.0 to 1.0 inclusive.');

    const EvidenceItem = z.object({
      post_shortcode: z
        .string()
        .describe('Instagram post shortCode (e.g., C2EJ4MxrHzd).'),
      excerpt: z
        .string()
        .max(240)
        .describe('Short snippet supporting the claim.'),
    });

    const ScoredClaim = z.object({
      label: z
        .string()
        .describe(
          'A short name for the trait being scored (snake_case recommended).',
        ),
      score: Score01.describe('How strongly the trait appears.'),
      confidence: Score01.describe(
        'How confident the model is, based on evidence.',
      ),
      evidence_refs: z
        .array(z.string())
        .describe(
          'List of EvidenceItem.ref_id values that support this claim.',
        ),
    });

    const InstagramStyleProfile = z.object({
      username: z.string().describe('The Instagram username being analyzed.'),
      summary: z
        .string()
        .describe("2-3 sentence summary of the user's style and vibe."),
      aesthetic_archetypes: z
        .array(ScoredClaim)
        .describe('Core fashion archetypes/subcultures with scores.'),
      lifestyle_and_occasion: z
        .array(ScoredClaim)
        .describe(
          'Occasion/lifestyle signals inferred from captions/comments/alt.',
        ),
      color_and_pattern_affinity: z
        .array(ScoredClaim)
        .describe(
          "Color/pattern preferences (avoid pixel claims if you didn't analyze pixels).",
        ),
      evidence_index: z
        .array(EvidenceItem)
        .min(1)
        .describe('All evidence items referenced by evidence_refs.'),
      overall_confidence: Score01.describe(
        'Overall confidence in this profile.',
      ),
      missing_data: z
        .array(z.string())
        .describe(
          "What you'd need next to improve accuracy (e.g., pixel analysis, brand tags).",
        ),
    });

    // 2) Call Responses API with Structured Outputs

    const response = await openai.responses.parse({
      model: 'gpt-5-mini-2025-08-07',
      input: [
        {
          role: 'system',
          content: [
            "You extract a user's style preferences from Instagram post metadata.",
            'Use images primarily, and use timestamp as reference.',
            'If information is missing, keep scores low and add a note in missing_data.',
            'Every ScoredClaim must reference evidence_index via evidence_refs.',
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'The order of images and imageMetaData are the same\n\n' +
                imageMetaData,
            },
            ...imageObjects,
          ],
        },
      ],
      text: {
        format: zodTextFormat(InstagramStyleProfile, 'instagram_style_profile'),
      },
    });

    console.log(response.output_parsed);
    // Parsed & validated output
    return response.output_parsed;

    // Example usage
    // const profile = await extractStyleProfile(postsArrayYouShared, "el0lse");
    // console.log(profile);
  }
  async history() {
    const exampleHistory = [
      {
        id: '8a9a5db2c1feba2be7564897490e4f6f724dd0e9',
        score: 24.553026,
        description:
          "There's nothing like bold hemlines and a soft touch. Featuring a deep V neckline, padded shoulders and ruching above a thigh-high front slit, our Love Sex Magic Velvet Dress is way too sexy to stay in the closet.Available in Wine and Hunter Green Deep V Thigh High Front Slit Shoulder Pads Ruching Detail Maxi Length Self 93% Polyester 7% Spandex Imported Available In Plus Sizes California Proposition 65WARNING: Cancer and Reproductive Harm - www.P65Warnings.ca.gov.",
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-274.jpg?v=1571438195',
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-278.jpg?v=1571438195',
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-286.jpg?v=1571438195',
          'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-282.jpg?v=1571438195',
        ],
        handle: 'love-sex-magic-velvet-dress-hunter',
        title: 'Love Sex Magic Velvet Dress - Hunter',
        price_min: 15.98,
        featured_image: {
          altText: null,
          width: 2523,
          url: 'https://cdn.shopify.com/s/files/1/0293/9277/products/Fashion_Nova_09-26-17-274.jpg?v=1571438195',
          height: 3784,
        },
        product_gid: 'gid://shopify/Product/10019894353',
        url: 'https://www.fashionnova.com/products/love-sex-magic-velvet-dress-hunter',
        tags: [
          '60sale',
          'bottom_length:Maxi',
          'category:Dresses',
          'category_es:Vestidos',
          'color:Hunter',
          'color_fam:Green',
          'ColorFam-Green',
          'default_collection_id:180828100',
          'detail:High Slit',
          'detail:Slit',
          'detail_es:Abertura',
          'detail_es:Abertura Alta',
          'Dresses',
          'fabric:Velvet',
          'fabric_es:Terciopelo',
          'figure:Plus',
          'final sale',
          'Formal',
          'Glam',
          'includedinpromo',
          'JRMODELHEIGHT-FT-5-IN-3',
          'Last Chance',
          'Maxi',
          'neckline:V-Neck',
          'neckline_es:Cuello En V',
          'occasion:Prom & Homecoming',
          'occasion_es:Baile De Graduación',
          'Plus',
          'print:Solid',
          'print_es:Estampado Sólido',
          'prop65-true',
          'Sale',
          'sleeve:Long Sleeve',
          'sleeve_es:Manga Larga',
          'WOMENS',
          'YGroup_AR082016',
        ],
        updated_at: '2026-02-10T23:00:42Z',
        indexed_at: '2026-02-18T09:04:05Z',
        store_domain: 'www.fashionnova.com',
        currency: 'USD',
        price_max: 15.98,
      },
      {
        id: '9e763f18ec7134e64d2f0dbf27dd14051ad364d9',
        score: 24.553026,
        description:
          'you need some constructive criticism. This baby tee has cap sleeves, a cropped fit, and text graphics printed across the chest.',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/hPYZngHtUC7dvOECoMeFhTjyLFOFslJp-24.jpg?v=1682744248',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/3lL0PXrwOXcGeGUYQwT6M0ThqbacA9ps-24.jpg?v=1682744249',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/rNzj8huyVVhg2BjZkfcQZruQbkuSMs62-24.jpg?v=1651783506',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/Cdjboigx1GE1pHFqgdT3TRnA7HUMCYC9-24.jpg?v=1651783506',
        ],
        handle: 'the-sex-was-bad-graphic-tee',
        title: 'The Sex Was Bad Graphic Tee',
        price_min: 50,
        featured_image: {
          altText: 'base',
          width: 843,
          url: 'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/hPYZngHtUC7dvOECoMeFhTjyLFOFslJp-24.jpg?v=1682744248',
          height: 1200,
        },
        product_gid: 'gid://shopify/Product/7640280236289',
        url: 'https://www.dollskill.com/products/the-sex-was-bad-graphic-tee',
        tags: [
          '[color:yellow]color_family:yellow--7640280236289',
          'algolia-ignore',
          'amazon_color:YELLOW',
          'category:Clothing',
          'color:YELLOW',
          'digital',
          'discounteligible',
          'exclude_rebuy',
          'fullprice',
          'launch_date:2/21/2022',
          'launchdate:2/21/2022',
          'main:efe0bd2c212eceec598c42a15b8cd07f',
          'micro:988f0f46dc0a1b862f17028987d2d399',
          'microcategory:Graphic T-Shirt',
          'parentId:259869',
          'regprice',
          'sale:pinksale',
          'sub2:044914add4ae99b6f7e510443478f9a8',
          'sub:11087d84f70335d1fec3aa9e72c8b1d5',
          'subcategory2:Graphic Tees',
          'subcategory:Tops',
          'trend:None',
          'YCRF_clothing_tops',
        ],
        updated_at: '2026-02-13T23:20:43Z',
        indexed_at: '2026-02-18T09:37:29Z',
        store_domain: 'www.dollskill.com',
        currency: 'USD',
        price_max: 50,
      },
      {
        id: 'ecebac762bcedda9971b7ac75f48f1373598270e',
        score: 24.553026,
        description:
          "Be dazzled with the latest hair craze, a sparkle logo clip. This accessory is one to top all your outfits off with it's silver diamante sex logo. The 90's hair slide has made a bold return!",
        image_urls: [
          'https://cdn.shopify.com/s/files/1/1444/3082/products/SOLINA-UNITARD-FIRE-MESH-21741.jpg?v=1571440766',
        ],
        handle: 'hair-clip-w-sex-logo',
        title: 'Hair Clip with Silver Sex Logo',
        price_min: 6,
        featured_image: {
          altText: 'Image of Hair Clip with Silver Sex Logo',
          width: 870,
          url: 'https://cdn.shopify.com/s/files/1/1444/3082/products/SOLINA-UNITARD-FIRE-MESH-21741.jpg?v=1571440766',
          height: 1100,
        },
        product_gid: 'gid://shopify/Product/2471674314865',
        url: 'https://www.motelrocks.com/products/hair-clip-w-sex-logo',
        tags: [
          'accessory',
          'diamante',
          'diamond',
          'festival',
          'festival wear',
          'grip',
          'hair accessory',
          'HAIR CLIP W/ SEX LOGO',
          'hair grip',
          'hair slide',
          'live',
          'logo hair slide',
          'ONE SIZE',
          'related: hair-clip-w-girls-logo',
          'related: hair-clip-w-heaven-logo',
          'related: hair-clip-w-smiley-face',
          'SEARCHANISE_IGNORE',
          'sex slide',
          'silver',
          'slide',
          'sparkle',
        ],
        updated_at: '2025-12-22T13:20:30Z',
        indexed_at: '2026-02-18T09:25:48Z',
        store_domain: 'motelrocks.com',
        currency: 'GBP',
        price_max: 6,
      },
      {
        id: '3664f56e99f948a6e1a42487a71125d0d4b58c1f',
        score: 24.553026,
        description:
          'switching the positions for you! These dice glow in the dark and have graphics of sex positions.',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/ua8cvyqhCRmgO5YZiLXDi5R90h0bmEzH-24.jpg?v=1682864955',
          'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/iwh565q8CpXE7KKImGpCv8W9QP9aAOoP-24.jpg?v=1682864956',
        ],
        handle: 'glow-in-the-dark-sex-dice',
        title: 'Glow In The Dark Sex Dice',
        price_min: 10,
        featured_image: {
          altText: 'base',
          width: 843,
          url: 'https://cdn.shopify.com/s/files/1/0634/6335/8721/products/ua8cvyqhCRmgO5YZiLXDi5R90h0bmEzH-24.jpg?v=1682864955',
          height: 1200,
        },
        product_gid: 'gid://shopify/Product/7671777755393',
        url: 'https://www.dollskill.com/products/glow-in-the-dark-sex-dice',
        tags: [
          '[color:rainbow]color_family:rainbow--7671777755393',
          'algolia-ignore',
          'amazon_color:MULTI',
          'bq1',
          'category:Accessories',
          'color:MULTI',
          'color:RAINBOW',
          'digital',
          'discounteligible',
          'exclude_rebuy',
          'fullprice',
          'launch_date:1/5/2021',
          'launchdate:1/5/2021',
          'main:98edb85b00d9527ad5acebe451b3fae6',
          'parentId:213188',
          'SALESUMMER',
          'sub2:66d0af2d5da0109dc2aae67829f7d4d4',
          'sub:7b3bac443b079338bdfc69e461b83cdc',
          'subcategory2:Toys',
          'subcategory:Other Shit',
          'trend:VDay 2021',
          'YCRF_accessories',
        ],
        updated_at: '2026-02-14T07:24:51Z',
        indexed_at: '2026-02-18T09:42:04Z',
        store_domain: 'www.dollskill.com',
        currency: 'USD',
        price_max: 10,
      },
      {
        id: 'f544e2339992e2ee4eeb172eed0ebb65b700d41a',
        score: 22.956072,
        description:
          'This crop top is made of 100% combed cotton, which makes the shirt extremely soft and more durable than regular cotton shirts. The relaxed fit and dropped shoulders ensure comfortable wear, while the cropped length makes it perfect for spring and summer. • 100% combed cotton • Heather colors are 15% viscose and 85% cotton • Fabric weight: 5.3 oz/yd² (180 g/m²) • Relaxed fit • Cropped length • Ribbed crew neck • Dropped shoulders • Side-seamed construction • Shoulder-to-shoulder taping • Double-needle hems • Preshrunk • Blank product sourced from BangladeshSize guide LENGTH (inches) WIDTH (inches) XS 17 ⅜ 18 ¾ S 17 ¾ 19 ¾ M 18 ¼ 20 ⅝ L 18 ¾ 21 ⅝ XL 19 ⅛ 22 ⅝ LENGTH (cm) WIDTH (cm) XS 44 47.5 S 45 50 M 46.5 52.5 L 47.5 55 XL 48.5 57.5',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-pale-pink-front-66d874b83db2e.jpg?v=1725461709',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-hazy-pink-front-66d874b83f800.jpg?v=1725461711',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-bubblegum-front-66d874b83fa70.jpg?v=1725461713',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-athletic-heather-front-66d874b83ff2a.jpg?v=1725461715',
        ],
        handle: 'apple-orchards-and-lesbian-sex-crop-top',
        title: 'Apple Orchards and Lesbian Sex crop top',
        price_min: 29.95,
        featured_image: {
          altText: null,
          width: 2000,
          url: 'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/womens-crop-top-pale-pink-front-66d874b83db2e.jpg?v=1725461709',
          height: 2000,
        },
        product_gid: 'gid://shopify/Product/7614295638068',
        url: 'https://gotfunnymerch.com/products/apple-orchards-and-lesbian-sex-crop-top',
        tags: ['Crop Top', 'Halloween', 'Pride'],
        updated_at: '2026-01-13T05:03:27Z',
        indexed_at: '2026-02-18T09:22:10Z',
        store_domain: 'gotfunnymerch.com',
        currency: 'USD',
        price_max: 29.95,
      },
      {
        id: 'e41324b5e3237538faec2ef1b8bd082ae87ac0ae',
        score: 22.956072,
        description:
          'A sturdy and warm sweatshirt bound to keep you warm in the colder months. A pre-shrunk, classic fit sweater that’s made with air-jet spun yarn for a soft feel. • 50% cotton, 50% polyester • Pre-shrunk • Classic fit • 1x1 athletic rib knit collar with spandex • Air-jet spun yarn with a soft feel • Double-needle stitched collar, shoulders, armholes, cuffs, and hemSize guide LENGTH (inches) WIDTH (inches) S 27 20 M 28 22 L 29 24 XL 30 26 2XL 31 28 3XL 32 30 4XL 33 32 5XL 34 34 LENGTH (cm) WIDTH (cm) S 68.6 50.8 M 71.1 55.9 L 73.7 61 XL 76.2 66 2XL 78.7 71.1 3XL 81.3 76.2 4XL 83.8 81.3 5XL 86.4 86.4',
        image_urls: [
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-sand-front-66d8751c7eba1.jpg?v=1725461807',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-light-blue-front-66d8751c814c3.jpg?v=1725461809',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-sport-grey-front-66d8751c81e51.jpg?v=1725461811',
          'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-light-pink-front-66d8751c83621.jpg?v=1725461813',
        ],
        handle: 'apple-orchards-and-lesbian-sex-unisex-sweatshirt',
        title: 'Apple Orchards and Lesbian Sex Unisex Sweatshirt',
        price_min: 37.95,
        featured_image: {
          altText: null,
          width: 2000,
          url: 'https://cdn.shopify.com/s/files/1/0581/8859/5252/files/unisex-crew-neck-sweatshirt-sand-front-66d8751c7eba1.jpg?v=1725461807',
          height: 2000,
        },
        product_gid: 'gid://shopify/Product/7614295867444',
        url: 'https://gotfunnymerch.com/products/apple-orchards-and-lesbian-sex-unisex-sweatshirt',
        tags: ['Halloween', 'Pride', 'Sweater', 'Thanksgiving'],
        updated_at: '2025-12-28T12:08:07Z',
        indexed_at: '2026-02-18T09:22:10Z',
        store_domain: 'gotfunnymerch.com',
        currency: 'USD',
        price_max: 37.95,
      },
    ];
    try {
      return exampleHistory;
    } catch (err: any) {
      // SQLite
      if (err?.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Email already exists');
      }
      // Postgres
      if (err?.code === '23505') {
        throw new ConflictException('Email already exists');
      }
      // MySQL
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email already exists');
      }

      throw err;
    }
  }
}
