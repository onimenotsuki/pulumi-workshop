import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Create a new stack
const stack = new pulumi.Stack('pulumi-workshop-dev-edgar-talledos-s3-bucket');

// Create a new VPC
const vpc = new awsx.ec2.Vpc('pulumi-workshop-vpc', {
    numberOfAvailabilityZones: 2,
});

// Create a new security group for the web server
const webSecurityGroup = new aws.ec2.SecurityGroup('pulumi-workshop-sg', {
    vpcId: vpc.id,
    ingress: [
        {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
        },
        {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
        },
    ],
});

// Create a new EC2 instance to run the web server
const instance = new aws.ec2.Instance('web-server', {
    ami: aws.ec2
        .getAmi(
            {
                filters: [
                    { name: 'name', values: ['nextjs-base-image'] },
                    { name: 'architecture', values: ['x86_64'] },
                ],
                owners: ['self'],
                mostRecent: true,
            },
            { async: true }
        )
        .then((result) => result.id),
    instanceType: 't2.micro',
    keyName: 'my-ssh-key',
    securityGroups: [webSecurityGroup.id],
    subnetId: vpc.publicSubnetIds[0],
    tags: { Name: 'Next.js Web Server' },
});

// Create an Elastic IP address for the web server
const elasticIp = new aws.ec2.Eip('web-server-eip', {
    instance: instance.id,
});

// Create an Application Load Balancer
const loadBalancer = new awsx.lb.ApplicationLoadBalancer('web-lb', {
    vpc: vpc,
    securityGroups: [webSecurityGroup],
    listeners: [
        {
            port: 80,
            protocol: 'HTTP',
            defaultActions: [
                {
                    type: 'forward',
                    targetGroupArn: awsx.lb.getTargetGroup('web-tg').arn,
                },
            ],
        },
    ],
});

// Create a target group for the web server instances
const targetGroup = new awsx.lb.TargetGroup('web-tg', {
    vpc: vpc,
    port: 80,
    targets: [instance],
});

// Create a listener rule to forward requests to the target group
loadBalancer.addListenerRule('web-rule', {
    pathPattern: '/*',
    priority: 1,
    targetGroupArn: targetGroup.arn,
});

// Export the load balancer's URL
export const url = loadBalancer.loadBalancerDnsName;
