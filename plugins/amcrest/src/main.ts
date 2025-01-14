import sdk, { MediaObject, Camera, ScryptedInterface } from "@scrypted/sdk";
import { Stream } from "stream";
import { AmcrestCameraClient, AmcrestEvent } from "./amcrest-api";
import { RtspSmartCamera, RtspProvider } from "../../rtsp/src/rtsp";
const { mediaManager } = sdk;


class AmcrestCamera extends RtspSmartCamera implements Camera {
    eventStream: Stream;

    constructor(nativeId: string) {
        super(nativeId);

        this.createMotionStream();
    }

    async createMotionStream() {
        while (true) {
            try {
                this.motionDetected = false;
                this.audioDetected = false;

                const api = this.createClient();
                for await (const event of api.listenEvents()) {
                    if (event === AmcrestEvent.MotionStart)
                        this.motionDetected = true;
                    else if (event === AmcrestEvent.MotionStop)
                        this.motionDetected = false;
                    else if (event === AmcrestEvent.AudioStart)
                        this.audioDetected = true;
                    else if (event === AmcrestEvent.AudioStop)
                        this.audioDetected = false;
                }
            }
            catch (e) {
                console.error('event listener failure', e);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }

    createClient() {
        return new AmcrestCameraClient(this.storage.getItem('ip'), this.getUsername(), this.getPassword());
    }

    async takePicture(): Promise<MediaObject> {
        const api = this.createClient();
        return mediaManager.createMediaObject(api.jpegSnapshot(), 'image/jpeg');
    }

    async getStreamUrl() {
        return `rtsp://${this.getRtspAddress()}/cam/realmonitor?channel=1&subtype=0`;
    }
}

class AmcrestProvider extends RtspProvider {
    getAdditionalInterfaces() {
        return [
            ScryptedInterface.Camera,
            ScryptedInterface.AudioSensor,
            ScryptedInterface.MotionSensor,
        ];
    }

    getDevice(nativeId: string): object {
        return new AmcrestCamera(nativeId);
    }
}

export default new AmcrestProvider();
