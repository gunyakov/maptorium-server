# create dest
mkdir -p node_modules/@img node_modules/@emnapi

# download & extract sharp win32 x64 runtime
curl -L -o /tmp/sharp-win32-x64.tgz \
  https://registry.npmjs.org/@img/sharp-win32-x64/-/sharp-win32-x64-0.34.5.tgz
mkdir -p node_modules/@img/sharp-win32-x64
tar -xzf /tmp/sharp-win32-x64.tgz -C node_modules/@img/sharp-win32-x64 --strip-components=1

# download & extract libvips for win32 x64 (if present)
curl -L -o /tmp/sharp-libvips-win32-x64.tgz \
  https://registry.npmjs.org/@img/sharp-libvips-win32-x64/-/sharp-libvips-win32-x64-1.2.4.tgz
mkdir -p node_modules/@img/sharp-libvips-win32-x64
tar -xzf /tmp/sharp-libvips-win32-x64.tgz -C node_modules/@img/sharp-libvips-win32-x64 --strip-components=1

# download & extract emnapi runtime (if electron-builder asks)
curl -L -o /tmp/emnapi-runtime.tgz \
  https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.8.1.tgz
tar -xzf /tmp/emnapi-runtime.tgz -C node_modules/@emnapi --strip-components=1