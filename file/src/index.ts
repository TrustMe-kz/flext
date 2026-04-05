import { getFlext, getFlextSync, getBuffer, getBufferSync } from '@/lib';
import { MixedSyncResult, FlextFileInterface } from '@/types';
import Flext from '@trustme24/flext';


// Classes

export class FlextFile implements FlextFileInterface {
    public data: Flext;

    constructor(val?: Flext | ArrayBuffer) {
        if (val) {
            if (val instanceof ArrayBuffer)
                this.data = getFlextSync(val);
            else
                this.data = val;
        }
    }

    public static from(val: Flext | ArrayBuffer, async: true): Promise<FlextFile>;
    public static from(val: Flext | ArrayBuffer, async?: false): FlextFile;
    public static from<P extends boolean = false>(val: Flext | ArrayBuffer, async?: P): MixedSyncResult<P, FlextFile> {
        if (!async) return new FlextFile().setData(val) as MixedSyncResult<P, FlextFile>;

        return new Promise((resolve, reject) => {
            new FlextFile().setData(val, true).then(resolve).catch(reject);
        }) as MixedSyncResult<P, FlextFile>;
    }

    public setData(val: Flext | ArrayBuffer, async: true): Promise<this>;
    public setData(val: Flext | ArrayBuffer, async?: false): this;
    public setData<P extends boolean = false>(val: Flext | ArrayBuffer, async?: P): MixedSyncResult<P, this> {
        if (!async) {
            if (val instanceof ArrayBuffer)
                this.data = getFlextSync(val);
            else
                this.data = val;

            return this as MixedSyncResult<P, this>;
        }

        return new Promise((resolve, reject) => {

            // Doing some checks

            if (val instanceof Flext) {
                this.data = val;
                return;
            }


            // Getting the data

            getFlext(val).then(result => {
                this.data = result;
                resolve(this);
            }).catch(reject);
        }) as MixedSyncResult<P, this>;
    }

    public getBuffer(async: true): Promise<ArrayBuffer>;
    public getBuffer(async?: false): ArrayBuffer;
    public getBuffer<P extends boolean = false>(async?: P): MixedSyncResult<P, ArrayBuffer> {
        if (!async) return getBufferSync(this.data) as MixedSyncResult<P, ArrayBuffer>;

        return new Promise((resolve, reject) => {
            getBuffer(this.data).then(resolve).catch(reject);
        }) as MixedSyncResult<P, ArrayBuffer>;
    }

    public getBlob(async: true): Promise<Blob>;
    public getBlob(async?: false): Blob;
    public getBlob<P extends boolean = false>(async?: P): MixedSyncResult<P, Blob> {
        if (!async) {
            const buffer = this.getBuffer();
            return new Blob([ buffer ], { type: 'application/zip' }) as MixedSyncResult<P, Blob>;
        }

        return new Promise((resolve, reject) => {
            this.getBuffer(true).then(result => {
                resolve(new Blob([ result ], { type: 'application/zip' }));
            }).catch(reject);
        }) as MixedSyncResult<P, Blob>;
    }

    public get buffer(): ArrayBuffer {
        return this.getBuffer();
    }

    public get blob(): Blob {
        return this.getBlob();
    }
}


export default FlextFile;

export { getFlext, getFlextSync, getBuffer, getBufferSync };
