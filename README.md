音声を入力するとそのテキスト情報から感情を認識し，その結果を元にチャットボットが反応します。また，発話内容とその感情をログとして記録し，発話をwavファイルとして自動ダウンロードします。  
  
【使い方】
1. 「Rec. START」をクリックし，ブラウザに向かって喋ってください。
2. 喋り終えたら「Rec. STOP」をクリックしてください。クリック後にwavファイルがダウンロードされます。
3. 「Emotion log」に表示される発話内容はいつでも修正可能です。修正が必要な場合は適宜修正してください。  
音声認識にはWeb SpeechRecognition API，感情認識にはGoogle Natural Language API，チャットボットにはopenAI APIを使用しています。
   
※Web SpeechRecognition APIはブラウザによっては機能しない可能性があります。  
※Google Natural Language APIはセキュリティの観点からAPIキーを指定していないため，Github Pages上では機能しません。  
※openAI APIはアクセスが集中している場合は機能しません。

