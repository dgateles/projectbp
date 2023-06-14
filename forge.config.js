module.exports = {
  packagerConfig: {
    icon: 'images/'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'SuchGuy',
          homepage: 'https://google.com',
          icon: 'images/icon.png'
        }
      }
    },
  ],
};
