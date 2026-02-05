import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.doberfamily.propertymanager',
	appName: 'Maintley',
	webDir: 'build',
	icon: 'icons/icon.png',
	server: {
		cleartext: true,
	},
};

export default config;
