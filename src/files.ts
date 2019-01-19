class S3File {
    Key: string;
    ETag: string;
    Url: string;
}
export class FileManager {
    public files: Array<S3File> = new Array();
    constructor(private s3, private bucket: string, private prefix: string) {
        this.haveFilesChanged();
    }

    private fetchFiles(): Promise<Array<S3File>> {
        return this.s3.listObjectsV2({ Bucket: this.bucket, MaxKeys: 1000, Prefix: this.prefix }).promise()
            .then(data => {
                const newFiles: Array<S3File> = data.Contents.map(file => {
                    return <S3File>{
                        Key: file.Key,
                        ETag: file.ETag,
                        Url: 'https://s3.amazonaws.com/' + this.bucket + '/' + file.Key
                    }
                });
                return newFiles;
            });
    }

    private static areEqual(array1: Array<S3File>, array2: Array<S3File>) {
        if (array1.length !== array2.length) {
            return false;
        }

        for (var i=0; i<array1.length; ++i) {
            if (array1[i].ETag !== array2[i].ETag) {
                return false;
            }
        }

        return true;
    }

    haveFilesChanged(): Promise<Boolean> {
        return this.fetchFiles()
            .then(newFiles => {
                if (FileManager.areEqual(newFiles, this.files)) {
                    return false;
                }
                
                this.files = newFiles;
                return true;
            });

    }
}