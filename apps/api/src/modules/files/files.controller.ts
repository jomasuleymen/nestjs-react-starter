import { AuthenticatedUser, CurrentUser } from '@modules/auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUploadDto, UploadUrlResponseDto } from './dto/create-upload.dto';
import { DownloadUrlResponseDto } from './dto/download-url-response.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('uploads')
  async createUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUploadDto,
  ): Promise<UploadUrlResponseDto> {
    // oxlint-disable-next-line typescript/no-misused-spread -- The validated DTO is passed as plain data.
    const upload = await this.filesService.createUpload({ ownerUserId: user.id, ...dto });

    return UploadUrlResponseDto.from(upload);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) fileId: string,
  ): Promise<FileResponseDto> {
    return FileResponseDto.from(await this.filesService.completeUpload(user.id, fileId));
  }

  @Get(':id/download-url')
  async createDownloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) fileId: string,
  ): Promise<DownloadUrlResponseDto> {
    return DownloadUrlResponseDto.from(await this.filesService.createDownload(user.id, fileId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) fileId: string,
  ): Promise<void> {
    await this.filesService.delete(user.id, fileId);
  }
}
