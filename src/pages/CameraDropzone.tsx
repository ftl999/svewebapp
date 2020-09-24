import UploadDropzone from './UploadDropzone';
import React from 'react';
//import { ImageCapture } from 'image-capture';
import { SVEProject, SVESystemInfo, SVEData } from 'svebaselib';
import { Block, Button } from 'framework7-react';
import Dropzone from 'react-dropzone';
import { ImageCapture } from 'image-capture/src/imagecapture';

export default class CameraDropzone extends UploadDropzone {
    render () {   
        return (
            <Block style={{display: "flex", justifyContent: "center", alignContent: "center"}}>
                <Dropzone onDrop={acceptedFiles => { this.onAcceptMedia(acceptedFiles) }}>
                {({getRootProps, getInputProps}) => (
                    <section style={{
                    backgroundImage: "url(\"images/DragNDropArea.png\")",
                    WebkitFilter: (this.hasError) ? "hue-rotate(240deg) saturate(3.3) grayscale(50%)" : "",
                    filter: (this.hasError) ? "hue-rotate(240deg) saturate(3.3) grayscale(50%)" : "",
                    backgroundRepeat: "no-repeat", 
                    backgroundSize: "100% 100%",
                    margin: "3em",
                    position: "relative",
                    padding: "3em"
                    }}>
                    <div {...getRootProps()}>
                        <input {...getInputProps()}/>
                        <Block style={{minHeight: "90%", minWidth: "100%", cursor: "copy"}}>{"Ziehe Dokumente zum Hochladen hier hin oder suche diese per Explorer."}</Block>
                    </div>
                    </section>
                )}
                </Dropzone>
                {(this.$f7.data.hasCameraPermission()) ? 
                    <div style={{justifyContent: "center", alignContent: "center", zIndex: 9, margin: "20px", width: "100%", height: "100%", position: "absolute", top: "0", left: "0", background: "transparent"}}>
                        <video
                            style={{margin: "5%", width: "90%", height: "90%"}}
                            playsInline
                            autoPlay
                            muted
                            id={this.props.id + "-camera-input"}
                        />
                        <div style={{position: "absolute", zIndex: 11, top: "0", left: "0", display: "grid", alignContent: "end"}}>
                            <Button raisedIos onClick={this.takePicture.bind(this)}>Scan</Button>
                        </div>
                    </div>
                :
                    <img 
                        src="images/privacy.png" 
                        style={{justifyContent: "center", alignContent: "center", zIndex: 9, margin: "20px", width: "100%", height: "100%", position: "absolute", top: "0", left: "0"}} 
                        onClick={this.setupCamera.bind(this)}
                    />
                }
            </Block>
        )
    }

    takePicture() {
        let elem = document.getElementById(this.props.id + "-camera-input") as HTMLVideoElement;
        let track = (elem.srcObject as MediaStream).getVideoTracks()[0];
        let imageCapture = new ImageCapture(track);
        imageCapture.takePhoto().then((blob: Blob) => {
          console.log("Took photo!");
          this.onAcceptMedia([new File([blob], "ScanPhoto.png")]);
        });
    }
    
    setupCamera() {
        this.$f7.data.getCameraStream().then((stream: MediaStream) => {
          let elem = document.getElementById(this.props.id + "-camera-input") as HTMLVideoElement;
          elem.srcObject = stream;
          elem.play();
          elem.onloadedmetadata = function(e) {
            // Ready to go. Do some stuff.
          };
        }, (err) => console.log(JSON.stringify(err)));
    }

    stopCamera() {
        let elem = document.getElementById(this.props.id + "-camera-input") as HTMLVideoElement;
        elem.pause();
        if (elem.srcObject !== undefined) {
            (elem.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            elem.srcObject = undefined;
        }
    }

    componentDidMount() {
        super.componentDidMount();
        this.setupCamera();
    }

    componentWillUnmount() {
        this.stopCamera();
    }
}