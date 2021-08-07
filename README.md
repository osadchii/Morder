#Morder – Marketplace management system

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.

###Integration with marketplaces:
* SberMegaMarket – only feeds now
* Ozon – only feeds now
* Yandex.Market – only feeds now
* MESO – not supported now
* Wildberries – not supported now
* Aliexpress – not supported now

###Docker-Compose

```yaml
version: '3.9'
services:
  mongo:
    image: mongo:4.4.4
    container_name: mongo
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=MONGO_LOGIN
      - MONGO_INITDB_ROOT_PASSWORD=MONGO_PASSWORD
    ports:
      - 27017:27017
    volumes:
      - ./mongo-data-4.4:/data/db
    command: --wiredTigerCacheSizeGB 1.5
    networks:
      - backend
  morder:
    image: docker.pkg.github.com/osadchii/morder/morder:morder
    container_name: morder
    restart: always
    ports:
      - 3000:3000
    volumes:
      - ./volume/morder/feeds:/opt/app/feeds
      - ./volume/morder/images:/opt/app/images
    networks:
      - backend
    environment:
      - MONGO_LOGIN=MONGO_LOGIN
      - MONGO_PASSWORD=MONGO_PASSWORD
      - MONGO_HOST=mongo
      - MONGO_PORT=27017
      - DOMAIN=http://HOST:3000

networks:
  backend:
    driver: bridge
```

Author: Osadchii Anton
<br/>
