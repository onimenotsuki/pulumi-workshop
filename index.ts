import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket('pulumi-workshop-dev-edgar-talledos-s3-bucket');

// Export the name of the bucket
export const bucketName = bucket.id;

const amplifyApp = new aws.amplify.App('sample-app', {
    buildSpec: ``,
});
