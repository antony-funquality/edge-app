### Builder image ##############################################################
FROM node:14 AS ts-builder

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

RUN yarn run build


### Final image ################################################################
FROM node:14

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Bundle builded app
COPY --from=ts-builder ./usr/src/app/dist ./dist


WORKDIR /usr/src/app
CMD yarn start
