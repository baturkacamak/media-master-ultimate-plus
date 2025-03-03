module.exports = {
    packagerConfig: {
        name: 'MediaMasterUltimatePlus',
        executableName: 'media-master-ultimate-plus',
        icon: './resources/icon',
        asar: true,
        extraResource: [
            './resources',
        ],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'MediaMasterUltimatePlus',
                iconUrl: 'https://raw.githubusercontent.com/baturkacamak/media-master-ultimate-plus/refs/heads/main/resources/icon.ico',
                setupIcon: './resources/icon.ico',
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    name: 'media-master-ultimate-plus',
                    productName: 'MEDIA MASTER - Ultimate Media Organizer Plus',
                    genericName: 'Media Organizer',
                    categories: ['Utility'],
                    icon: './resources/icon.png',
                },
            },
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {
                options: {
                    name: 'media-master',
                    productName: 'Media Master',
                    genericName: 'Media Organizer',
                    categories: ['Utility'],
                    icon: './resources/icon.png',
                },
            },
        },
        {
            name: '@electron-forge/maker-dmg',
            config: {
                name: 'MediaMasterUltimatePlus',
                icon: './resources/icon.icns',
                background: './resources/background.png',
                contents: [
                    {
                        x: 410,
                        y: 220,
                        type: 'link',
                        path: '/Applications',
                    },
                    {
                        x: 130,
                        y: 220,
                        type: 'file',
                    },
                ],
            },
        },
    ],
};