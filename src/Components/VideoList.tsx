import Close from '@material-ui/icons/Close'
import Star from '@material-ui/icons/Star'
import StarBorder from '@material-ui/icons/StarBorder'
import Icon from '@material-ui/core/Icon';
import * as React from 'react'

interface IState{
    usersCountCurrent: any,
    videoList: any
}

interface IProps{
    mount:any,
    play:any,
    hubConnection:any
}

export default class VideoList extends React.Component<IProps,IState>{
    public constructor(props:any){
        super(props);
        this.state = {
            usersCountCurrent: 0,
            videoList: []
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
              this.Like();
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

    public Like(){
        console.log("test")
    }

    public render() {
        const style = { 
            display: 'inline-flex',
            fontSize: 25,
            verticalAlign: 'middle',
        }
        return (
            <div className="video-list">
                <h1 className="play-heading"><span className="blue-heading">play</span>video</h1>
                <div className="btn btn-primary bottom-button" onClick={this.Like}><span className="blue-heading">Like</span></div>
                <table className="table">
                    {this.state.videoList}
                </table>
            </div>
        )
    }
}