import Close from '@material-ui/icons/Close'
import Star from '@material-ui/icons/Star'
import StarBorder from '@material-ui/icons/StarBorder'
import * as React from 'react'
import thumbsUp from '../Image/thumbs_up.png';
import thumbsDown from '../Image/thumbs_down.png';

interface IState{
    usersCountCurrent: any,
    videoList: any,
    likeList: any,
    dislikeList: any,
}

interface IProps{
    mount:any,
    play:any,
    hubConnection:any,
    name: any
}

export default class VideoList extends React.Component<IProps,IState>{
    public constructor(props:any){
        super(props);
        this.state = {
            usersCountCurrent: 0,
            videoList: [],
            likeList: [],
            dislikeList: [],
        }
        this.updateList();
    }

    public deleteVideo = (id:any) => {
        fetch("https://jae2019msaphase2scribeapi.azurewebsites.net/api/Videos/"+id,{
            method:'DELETE'
        }).then(() => {
            this.updateList()
        }).then(() => {this.props.hubConnection.invoke("DeleteVideo")});
    }

    public playVideo = (videoUrl:string) => {
        this.props.play(videoUrl)
    }

    public updateList = () => {
        fetch('https://jae2019msaphase2scribeapi.azurewebsites.net/api/Videos',{
            method:'GET'
        }).then((ret:any) => {
            return ret.json();
        }).then((result:any) => {
            const output:any[] = []
            result.forEach((video:any) => {
                const row = (<tr>
                    <td className="align-middle" onClick={() => this.handleLike(video)}>{video.isFavourite === true?<Star/>:<StarBorder/>}</td>
                    <td className="align-middle" onClick={() => this.playVideo(video.webUrl)}><img src={video.thumbnailUrl} width="100px" alt="Thumbnail"/></td>
                    <td className="align-middle" onClick={() => this.playVideo(video.webUrl)}><b>{video.videoTitle}</b></td>
                    <td className="align-middle" onClick={() => this.Like(video)}><div className="btn2 btn-primary bottom-button"><span className="thumbUp-heading"><img src={thumbsUp} height='30'/>{video.like}</span></div></td>
                    <td className="align-middle" onClick={() => this.Dislike(video)}><div className="btn2 btn-primary bottom-button"><span className="thumbDown-heading"><img src={thumbsDown} height='30'/>{video.dislike}</span></div></td>
                    <td className="align-middle video-list-close"><button onClick={() => this.deleteVideo(video.videoId)}><Close/></button></td>
                </tr>)
                if(video.isFavourite){
                    output.unshift(row);
                }else{
                    output.push(row);
                }
            });
            this.setState({videoList:output})
        })
    }

    public handleLike = (video:any) => {

        const toSend = [{
            "from":"",
            "op":"replace",
            "path":"/isFavourite",
            "value":!video.isFavourite,
        }]
        fetch("https://jae2019msaphase2scribeapi.azurewebsites.net/api/Videos/update/"+video.videoId, {
            body:JSON.stringify(toSend),
            headers: {
              Accept: "text/plain",
              "Content-Type": "application/json-patch+json"
            },
            method: "PATCH"
          }).then(() => {
              this.updateList();
          })
    }
    
    public componentDidMount = () => {
        this.props.mount(this.updateList)
        this.updateList()

        this.props.hubConnection.on("DeleteVideo", ()  => {
            this.updateList();
            console.log('A video has been deleted.');
        });

        this.props.hubConnection.on("ShowUserCounts", (usersCount: any)  => {
            console.log(usersCount);
            this.setState({usersCountCurrent:usersCount});
        });

    }

    public Like(video:any){
        if(this.state.likeList.includes(video.videoId)){
            console.log("You cannot like the same video")
        }
        else{
            const body = {
                "videoId": video.videoId,
                "videoTitle": video.videoTitle,
                "videoLength": video.videoLength,
                "webUrl": video.webUrl,
                "thumbnailUrl": video.thumbnailUrl,
                "isFavourite": video.isFavourite,
                "like": video.like + 1,
                "dislike": video.dislike,
                "transcription": video.transcription
            }
            
            console.log(JSON.stringify(body));
            fetch("https://jae2019msaphase2scribeapi.azurewebsites.net/api/Videos/"+video.videoId,{
                body:JSON.stringify(body),
                headers: {
                    Accept: "text/plain",
                    "Content-Type": "application/json"
                },
                method:'PUT'
            }).then(() => {
                this.state.likeList.push(video.videoId)
                console.log("Like Video")
                this.updateList()
            });
        }
    }
    
    public Dislike(video:any){
        if(this.state.dislikeList.includes(video.videoId)){
            console.log("You cannot dislike the same video")
        }
        else{
            const body = {
                "videoId": video.videoId,
                "videoTitle": video.videoTitle,
                "videoLength": video.videoLength,
                "webUrl": video.webUrl,
                "thumbnailUrl": video.thumbnailUrl,
                "isFavourite": video.isFavourite,
                "like": video.like - 1,
                "dislike": video.dislike,
                "transcription": video.transcription
            }
            
            console.log(JSON.stringify(body));
            fetch("https://jae2019msaphase2scribeapi.azurewebsites.net/api/Videos/"+video.videoId,{
                body:JSON.stringify(body),
                headers: {
                    Accept: "text/plain",
                    "Content-Type": "application/json"
                },
                method:'PUT'
            }).then(() => {
                this.state.dislikeList.push(video.videoId)
                console.log("Disike Video")
                this.updateList()
            });
        }
    }
    

    public render() {
        return (
            
            <div className="video-list">
                <h1 className="play-heading">Welcome <span className="blue-heading">{this.props.name}</span>. </h1>
                <h1 className="play-heading">Here's <span className="blue-heading">video</span> List</h1>
                
                <table className="table">
                    {this.state.videoList}
                </table>
            </div>
        )
    }
}