# r0-rich

## Development

lein deps

lein cljsbuild auto (or once)

lein run / lein ring server

## Production

lein ring server-headless 80

## Compile and deploy

lein ring uberjar

java -jar target/<filename>-standalone.jar

## License

Copyright © 2013 Rich Tech
