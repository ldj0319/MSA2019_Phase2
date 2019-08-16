import * as React from 'react';
import * as Webcam from "react-webcam";
import ReactPlayer from 'react-player';
// import CaptionArea from 'src/Components/CaptionArea';
import Header from 'src/Components/Header';
import VideoList from 'src/Components/VideoList';
import 'src/App.css'

interface IState {
  hubConnection: any,
  updateVideoList: any,
  player: any,
  playingURL: string
  videoList: object,
  authenticated: boolean,
  refCamera: any,
  predictionResult: any
}

class App extends React.Component<{}, IState>{
  public signalR = require("@aspnet/signalr");
  public constructor(props: any) {
    super(props);
    this.state = {
      hubConnection: new this.signalR.HubConnectionBuilder().withUrl("https://jae2019msaphase2scribeapi.azurewebsites.net/hub").build(),
      player: null,
      playingURL: "",
      updateVideoList: null,
      videoList: [],
      authenticated: false,
      refCamera: React.createRef(),
      predictionResult: null
    }

    this.authenticate = this.authenticate.bind(this)
  }

  public setRef = (playerRef: any) => {
    this.setState({
      player: playerRef
    })
  }

  public addVideo = (url: string) => {
    const body = {"url": url}
    fetch("https://jae2019msaphase2scribeapi.azurewebsites.net/api/Videos", {
      body: JSON.stringify(body),
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json"
      },
      method: "POST"
    }).then(() => {
      this.state.updateVideoList();
    }).then(() => {this.state.hubConnection.invoke("VideoAdded")});
  }

  public updateURL = (url: string) => {
    if(this.state.playingURL === url){
      this.setState({playingURL : ""},() => this.setState({playingURL: url}))
    }else{
      this.setState({playingURL:url})
    }
  }

  public currentVideo(){
    console.log(this.state.playingURL);
  }
  public listMounted = (callbacks: any) => {
    this.setState({ updateVideoList: callbacks })
  }

  public componentDidMount = () => {

    this.state.hubConnection.on("Connect", ()  => {
      console.log('A new user has connected to the hub.');
    });

    this.state.hubConnection.on("UpdateVideoList", ()  => {
      this.state.updateVideoList();
      console.log('A new video has been added!');
    });

    this.state.hubConnection.on("VideoDeleted", ()  => {
      console.log('A video is deleted!');
    });

    this.state.hubConnection.on("VideoAdded", ()  => {
      console.log('A video is added!!!');
    });

    this.state.hubConnection.start().then(() => this.state.hubConnection.invoke("BroadcastMessage"));
  }
  
  public render() {

    const { authenticated } = this.state

    return (<div>
      <div>
                {(!authenticated) ?
                    <div className="video"> 
                        <Webcam 
                            audio={false}
                            screenshotFormat="image/jpeg"
                            ref={this.state.refCamera}
                        />
                        <div className="row nav-row">
                            <div className="btn btn-primary bottom-button" onClick={this.authenticate}>Login</div>
                        </div>
                    </div>
                    : ""}


                {(authenticated) ?
                    <div>

      <Header addVideo={this.addVideo} />
      <div className="container">
        <div className="row">
          <div className="col-7">
            <ReactPlayer
              className="player"
              ref={this.setRef}
              controls={true}
              url={this.state.playingURL}
              width="100%"
              height="400px"
              playing={true}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 },
                  preload: true
                }
              }
              }
            />
          </div>
          <div className="col-5">
            <VideoList play={this.updateURL} mount={this.listMounted} hubConnection={this.state.hubConnection}/>
          </div>
        </div>
        {/* <CaptionArea currentVideo={this.state.playingURL} play={this.updateURL} /> */}
        </div>
                    </div>
                    : ""}

            </div>

        </div>)
  }
  // Call custom vision model
  private getFaceRecognitionResult(image: string) {
    const url = "https://australiaeast.api.cognitive.microsoft.com/customvision/v3.0/Prediction/6c893c33-73f0-467f-865a-c28f8fa79f74/classify/iterations/Iteration1/image"
    if (image === null) {
        return;
    }
    const base64 = require('base64-js');
    const base64content = image.split(";")[1].split(",")[1]
    const byteArray = base64.toByteArray(base64content);
    fetch(url, {
        body: byteArray,
        headers: {
            'cache-control': 'no-cache', 'Prediction-Key': '63d4a7208d114a1da049e48b17e1e456', 'Content-Type': 'application/octet-stream'
        },
        method: 'POST'
    })
        .then((response: any) => {
            if (!response.ok) {
                // Error State
                alert(response.statusText)
            } else {
                response.json().then((json: any) => {
                    console.log(json.predictions[0])

                    this.setState({ predictionResult: json.predictions[0] })
                    if (this.state.predictionResult.probability > 0.7) {
                        this.setState({ authenticated: true })
                    } else {
                        this.setState({ authenticated: false })
                        console.log(json.predictions[0].tagName)
                    }
                })
            }
        })
}


  private authenticate() {
    const screenshot = this.state.refCamera.current.getScreenshot();
    this.smile(screenshot);    
  }

  private smile(image:string ){
    const byteArrayImage = this.convertToByteArray(image);
    // console.log(image);
    this.fetchData(byteArrayImage);
  }

  private fetchData = (byteArray: any) => {
    const apiKey = '3a0d525bd701431d83b41cc6fafd73af';
    const apiEndpoint = 'https://australiaeast.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceAttributes=emotion'
    fetch(apiEndpoint, {
        body: byteArray,
        headers: {
            'cache-control': 'no-cache', 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/octet-stream'
        },
        method: 'POST'
    }).then(response => {
        console.log(response.status);
        if (response.ok) {
          response.json().then(data => {
              let happiness = (data[0] != null ? data[0].faceAttributes.emotion.happiness : 0);
              happiness = (Math.round(happiness * 100))
              if (happiness >= 0) {
                  console.log(happiness);
                  const screenshot = this.state.refCamera.current.getScreenshot();
                  this.getFaceRecognitionResult(screenshot);
              }
          });
      }
    });
  }

  private convertToByteArray = (image:string) => {
    const base64 = require('base64-js');
    const base64string = image.split(',')[1];
    return base64.toByteArray(base64string)
};
}

export default App;