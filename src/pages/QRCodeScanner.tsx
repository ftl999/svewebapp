import QrcodeDecoder from 'qrcode-decoder';
import React from 'react';
import { Block, Page, List, Icon, BlockTitle, Popup, ListInput, ListButton, BlockHeader, ListItem } from 'framework7-react';

export type QRCodeScannerSettings = {
    onDecoded: (result: string) => void
};

export default class QRCodeScanner extends React.Component<QRCodeScannerSettings & React.HTMLAttributes<HTMLCanvasElement>, {}> {
    protected result: string = "";
    protected visible: boolean = false;
    protected cameraActive: boolean = false;
    protected onDecoded: (result: string) => void = (result: string) => {};

    render () {   
        return (
            <Popup swipeToClose opened={this.visible} onPopupClosed={() => { this.visible = false; this.stopCamera(); }}>
                <Page>
                    <BlockTitle large style={{justifySelf: "center"}}>Scanne QR Code..</BlockTitle>
                    <Block style={{justifyContent: "center", alignContent: "center"}}>
                        <video
                            style={{margin: "5%", width: "90%", height: "90%"}}
                            playsInline
                            autoPlay
                            muted
                            id={this.props.id + "-camera-input"}
                        />
                    </Block>
                </Page>
            </Popup>
        )
    }

    stopCamera() {
        let elem = document.getElementById(this.props.id + "-camera-input") as HTMLVideoElement;
        elem.pause();
        if (elem.srcObject !== undefined) {
            (elem.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            elem.srcObject = undefined;
        }
    }

    setupCamera() {
        if (!this.cameraActive) {
            this.cameraActive = true;
            this.$f7.data.getCameraStream().then((stream: MediaStream) => {
                let elem = document.getElementById(this.props.id + "-camera-input") as HTMLVideoElement;
                elem.srcObject = stream;
                elem.play();
                var self = this;
                var qr = new QrcodeDecoder();
                (qr as any).decodeFromCamera(elem).then(res => {
                    self.result = res.data;
                    self.onDecoded(self.result);
                });
            }, (err) => {
                this.cameraActive = false;
                console.log(JSON.stringify(err));
            });
        }
    }

    setComponentVisible(val: boolean) {
        this.visible = val;
        this.forceUpdate();
    }

    componentWillUpdate() {
        var self = this;
        this.$f7ready((f7) => {
            self.setupCamera();
        });
    }
    componentDidUpdate() {
        var self = this;
        this.$f7ready((f7) => {
            self.setupCamera();
        });
    }

    componentDidMount() {
        this.$f7.data.setPopupComponent(QRCodeScanner, this);
        this.onDecoded = this.props.onDecoded;
        var self = this;
        this.$f7ready((f7) => {
            self.setupCamera();
            self.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.$f7.data.setPopupComponent(QRCodeScanner, undefined);
    }
}