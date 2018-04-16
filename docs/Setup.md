# Setting Up an SDM

Running an SDM instance requires the following setup.

## Pre-requisites

#### Java

To build Java projects on the automation client node, you'll need:

- JDK, for Maven and Checkstyle
- Maven, with `mvn` on the path

#### Node

To build Node projects on the automation client node, you'll need:

- `npm` - v 5.8.0 or above
- `node`

#### Kubernetes

The kubernetesSoftwareDevelopmentMachine included here deploys to an Atomist sandbox kubernetes environment, using
[k8-automation](https://github.com/atomist/k8-automation) which we run inside our cluster. You can deploy the Spring Boot
projects created with `@atomist create spring` here, in order to try out the Kubernetes integration with the SDM.


## Environment Setup

### Choose a machine
You must set environment variables to choose a machine, if you override the default.
```
export MACHINE_PATH="./software-delivery-machine/machines"
export MACHINE_NAME="cloudFoundrySoftwareDeliveryMachine"
```

### Local HTTP server
To run a local HTTP server to invoke via `curl` or for smoke testing, please set the following environment variable:

```
export LOCAL_ATOMIST_ADMIN_PASSWORD="<value>"

```

#### Cloud Foundry

In order to enable Pivotal Cloud Foundry deployment, the following environment variables are used.

Required:

- `PIVOTAL_USER`: your Pivotal Cloud Foundry user name
- `PIVOTAL_PASSWORD`: your Pivotal Cloud Foundry password 
- `PCF_ORG`: your Pivotal Cloud Foundry organization name
- `PCF_SPACE_STAGING`: your Pivotal Cloud Foundry staging space name within `$PCF_ORG`
- `PCF_SPACE_PRODUCTION`: your Pivotal Cloud Foundry production space name within `$PCF_ORG`

Optional:

- `PIVOTAL_API`: PCF API to hit. Default if this key is not provided is Pivotal Web Services at `https://api.run.pivotal.io`. Specify a different value to deploy to your own Cloud Foundry instance.


#### Checkstyle
 
Checkstyle is a style-checker for Java.
For the optional Checkstyle integration to work, set up two Checkstyle environment variables as follows:

```
# Toggle Checkstyle usage
export USE_CHECKSTYLE=true

# Path to checkstyle JAR
export CHECKSTYLE_PATH="/Users/rodjohnson/tools/checkstyle-8.8/checkstyle-8.8-all.jar"
```

Get `checkstyle-8.8-all.jar` from [Checkstyle's download page](https://sourceforge.net/projects/checkstyle/files/checkstyle/8.8/).
