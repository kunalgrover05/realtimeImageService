const Sharp = require('sharp');

export class ImageConverter {
    constructor(private s3, private bucket: string, private convertFolder: string) {
    }
    
    convertFile(fileName: string) {
        return this.convertFileAsync(fileName);
    }

    private async convertFileAsync(fileName: string) {
        const fileData = await this.s3.getObject({
            Bucket: this.bucket,
            Key: fileName
        })
        .promise();

        // TODO: Process only images
        const contentType = fileData.ContentType;
        const convertedFile = await Sharp(fileData.Body)
            .resize(640, 480, {
                fit: 'inside'
            }).toBuffer();
    
        const uploadedData = await this.s3.putObject({
            Body: convertedFile,
            Bucket: this.bucket,
            Key: this.convertFolder +  fileName
        }).promise();
        return uploadedData;
    };
}
