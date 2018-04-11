FROM ubuntu

LABEL maintainer="Christian Dupuis <cd@atmoist.com>"

RUN apt-get -yqq update && apt-get install -yqq \
    curl

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash - \
    && apt-get install -y nodejs \
    && npm i -g npm

RUN apt-get -yqq update && apt-get -yqq install docker.io

ENV DUMB_INIT_VERSION=1.2.1
RUN curl -s -L -O https://github.com/Yelp/dumb-init/releases/download/v$DUMB_INIT_VERSION/dumb-init_${DUMB_INIT_VERSION}_amd64.deb \
    && dpkg -i dumb-init_${DUMB_INIT_VERSION}_amd64.deb \
    && rm -f dumb-init_${DUMB_INIT_VERSION}_amd64.deb

RUN git config --global user.email "bot@atomist.com" &&  git config --global user.name "Atomist Bot"

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app/
COPY package-lock.json /app/

ENV NPM_CONFIG_LOGLEVEL warn
ENV SUPPRESS_NO_CONFIG_WARNING true
ENV NODE_ENV production

RUN npm install

# Bundle app source
COPY . /app

EXPOSE 2866

ENTRYPOINT [ "dumb-init", "node", "--trace-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=384" ]

CMD [ "node_modules/@atomist/automation-client/start.client.js" ]