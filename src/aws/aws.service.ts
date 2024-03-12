import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsService {
  private logger = new Logger(AwsService.name);
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  public async uploadArquivo(file: any, id: string) {
    const AWS_S3_BUCKET = this.configService.get<string>('AWS_S3_BUCKET');
    const AWS_REGION = this.configService.get<string>('AWS_REGION');

    const fileExtension = file.originalname.split('.')[1];
    const urlKey = `${id}.${fileExtension}`;

    this.logger.log(`urlKey: ${urlKey}`);

    const params = {
      Body: file.buffer,
      Bucket: `${AWS_S3_BUCKET}`,
      Key: urlKey,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(params));

      return {
        url: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${urlKey}`,
      };
    } catch (err) {
      this.logger.error(err);
      return err;
    }
  }
}
