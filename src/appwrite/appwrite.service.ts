import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client, Account } from 'node-appwrite';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppwriteService {
  private account: Account;

  constructor(private configService: ConfigService) {
    const client = new Client();
    client
      .setEndpoint('https://cloud.appwrite.io/v1')
      .setProject(this.configService.get('APPWRITE_PROJECT_ID')!);

    this.account = new Account(client);
  }

  async getUser(jwt: string) {
    try {
      // 🔹 Attach JWT as a session token
      this.account.client.setJWT(jwt);

      // 🔹 Get authenticated user details
      return await this.account.get();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }
}
