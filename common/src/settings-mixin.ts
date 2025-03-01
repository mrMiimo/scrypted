import { Settings, Setting, MixinDeviceBase, ScryptedInterface } from "@scrypted/sdk";

export interface SettingsMixinDeviceOptions {
    providerNativeId: string;
    mixinDeviceInterfaces: ScryptedInterface[];
    group: string;
    groupKey: string;
}

export abstract class SettingsMixinDeviceBase<T> extends MixinDeviceBase<T & Settings> implements Settings {
    settingsGroup: string;
    settingsGroupKey: string;

    constructor(mixinDevice: any, mixinDeviceState: { [key: string]: any }, options: SettingsMixinDeviceOptions) {
        super(mixinDevice, options.mixinDeviceInterfaces, mixinDeviceState, options.providerNativeId);

        this.settingsGroup = options.group;
        this.settingsGroupKey = options.groupKey;
    }

    abstract getMixinSettings(): Promise<Setting[]>;
    abstract putMixinSetting(key: string, value: string | number | boolean): Promise<void>;

    async getSettings(): Promise<Setting[]> {
        const settings = this.mixinDeviceInterfaces.includes(ScryptedInterface.Settings) ?
            await this.mixinDevice.getSettings() : [];

        const mixinSettings = await this.getMixinSettings();
        for (const setting of mixinSettings) {
            setting.group = setting.group || this.settingsGroup;
            setting.key = this.settingsGroupKey + ':' + setting.key;
        }

        settings.push(...mixinSettings);

        return settings;
    }

    async putSetting(key: string, value: string | number | boolean) {
        const prefix = this.settingsGroupKey + ':';
        if (!key?.startsWith(prefix)) {
            return this.mixinDevice.putSetting(key, value);
        }

        return this.putMixinSetting(key.substring(prefix.length), value)
    }
}
