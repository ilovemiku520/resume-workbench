# 关注初音未来谢谢喵，ilovemiku520 / Please follow Hatsune Miku, thank you meow, ilovemiku520.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4318
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4318
CMD ["node", "dist/node/server/index.js"]
