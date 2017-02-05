# serverless-dir-config-plugin
This is a plugin makes it possible to keep your function and resource definitions in separate files in a directory structure instead of the serverless.yml

#Installation
External Plugins are added on a per service basis and are not applied globally. Make sure you are in your Service's root directory, then install the corresponding Plugin with the help of NPM:

```
npm install --save serverless-dir-config-plugin
```

In your service create a directory structure like

```
mkdir serverless
mkdir serverless/functions
mkdir serverless/resources
```

The plugin will look in these directories for files ending in .yml to load in.  You can nest them any way you want. 
They use the same structure of yaml as the way they are included in the serverless.yml. They also support all
the variable resolution that the main file supports.

```
hello:
  handler: lib/handler.hello
  role: BasicLambdaRole
  events:
    - http:
        path: hello
        method: get
        integration: lambda-proxy
```

Keep in mind for the resources there are multiple resouce types.  Make sure you include the type first:
```
Resources:
  BasicLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ${self:service}-${self:provider.stage}-BasicLambdaRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ${self:service}-${self:provider.stage}-BasicLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - "logs:*"
                  - "cloudwatch:*"
                Resource: "*"
```



## Configuration
Currently the only thing you can configure is if it shows what resources and functions are being loaded.
If you don't want to see that - set quiet to true.

```

custom:
  dirconfig:
      quiet: false
```

# Warnings

Serverless.js doesn't provide hooks to append to the config file. This plugin ends up making some assumptions to work.

1.  Currently the framework loads all the plugins before it does anything. This allows the plugin to look for the files and append them to the configuration before anything happens.

1.  After the configuration is loaded all the variables get resolved.  The plugin monkeypatches this process so it can add in function names once the variables are all set.

This means that right now the way the plugin works is very fragile. If the Serverless.js changes the way they load things - this plugin will break.  I am hoping that after confirming that this plugin is useful I will submit a PR that looks at giving plugins access to the hooks that I'm basically inventing.
