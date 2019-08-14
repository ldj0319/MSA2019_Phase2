using Newtonsoft.Json;
using scribeAPI.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Xml;

namespace scribeAPI.Helper
{
  public class YouTubeHelper
  {
    public static void testProgram()
    {
      Console.WriteLine(GetTranscriptions("sAiTuitN5b8"));
      Console.ReadLine();
    }

    public static String GetVideoIdFromURL(String videoURL)
    {
      int indexOfFirstId = videoURL.IndexOf("=") + 1;
      String videoId = videoURL.Substring(indexOfFirstId);
      return videoId;
    }

    public static Video GetVideoFromId(string videoId) {

      String APIKey = "AIzaSyASwvZlbJL3FPAH2jmaavy3Wy1Jtk74i5o";
      String YouTubeAPIURL = "https://www.googleapis.com/youtube/v3/videos?id=" + videoId + "&key=" + APIKey + "&part=snippet,contentDetails";

      // Use an http client to grab the JSON string from the web.
      String videoInfoJSON = new WebClient().DownloadString(YouTubeAPIURL);

      // Using dynamic object helps us to more efficiently extract information from a large JSON String.
      dynamic jsonObj = JsonConvert.DeserializeObject<dynamic>(videoInfoJSON);

      String title = jsonObj["items"][0]["snippet"]["title"];
      String thumbnailURL = jsonObj["items"][0]["snippet"]["thumbnails"]["medium"]["url"];
      String durationString = jsonObj["items"][0]["contentDetails"]["duration"];
      String videoUrl = "https://www.youtube.com/watch?v=" + videoId;

      TimeSpan videoDuration = XmlConvert.ToTimeSpan(durationString);
      int duration = (int)videoDuration.TotalSeconds;

      Video video = new Video
      {
        VideoTitle = title,
        WebUrl = videoUrl,
        VideoLength = duration,
        IsFavourite = false,
        ThumbnailUrl = thumbnailURL
      };
      return video;
    }

    private static String GetTranscriptionLink(String videoId) {
      String YouTubeVideoURL = "https://www.youtube.com/watch?v=" + videoId;
      // Use a WebClient to download the source code.
      String HTMLSource = new WebClient().DownloadString(YouTubeVideoURL);

      String pattern = "timedtext.+?lang=";
      Match match = Regex.Match(HTMLSource, pattern);

      String subtitleLink = "https://www.youtube.com/api/" + match + "en";
      return subtitleLink;
    }

    private static String CleanLink(String subtitleURL)
    {
      subtitleURL = subtitleURL.Replace("\\\\u0026", "&");
      subtitleURL = subtitleURL.Replace("\\", "");
      return (subtitleURL);
    }

    public static List<Transcription> GetTranscriptions(String videoId)
    {
      String subtitleLink = CleanLink(GetTranscriptionLink(videoId));
      String XMLSource = new WebClient().DownloadString(subtitleLink);

      // Use XmlDocument to load the subtitle XML.
      XmlDocument doc = new XmlDocument();
      // doc.LoadXml(XMLSource);
      doc.LoadXml(XMLSource);
      XmlNode root = doc.ChildNodes[1];
      
      // Go through each tag and look for start time and phrase.
      List<Transcription> transcriptions = new List<Transcription>();
      if (root.HasChildNodes)
      {
        for (int i = 0; i < root.ChildNodes.Count; i++)
        {
          // Decode HTTP characters to text
          // e.g. &#39; -> '
          String phrase = root.ChildNodes[i].InnerText;
          phrase = HttpUtility.HtmlDecode(phrase);

          Transcription transcription = new Transcription
          {
            StartTime = (int)Convert.ToDouble(root.ChildNodes[i].Attributes["start"].Value),
            Phrase = phrase
          };

          transcriptions.Add(transcription);
        }
      }
      return transcriptions;
      
    }

  }
}
