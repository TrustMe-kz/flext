import { defineModule } from '@/lib';
import qrcode from 'qrcode-generator';


// Functions

export function url(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ data ] = args;


    // Getting the QR

    const qr = qrcode(0, 'M');

    qr.addData(data);
    qr.make();


    // Getting the data

    const svg = qr.createSvgTag({
        scalable: true,
    });

    const blob = new Blob([ svg ], {
        type: 'image/svg+xml;charset=utf-8',
    });


    return URL.createObjectURL(blob);
}


export default defineModule({
    helpers: {
        url: url,
        __default: url,
    },
});
