'use strict';
var conference;
var publicationGlobal;
const runSocketIOSample = function() {

    let localStream;
    let showedRemoteStreams = [];
    let myId;
    let subscriptionForMixedStream;
    let myRoom;

    function getParameterByName(name) {
        name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(
            /\+/g, ' '));
    }

    var subscribeForward = getParameterByName('forward') === 'true'?true:false;
    var isSelf = getParameterByName('self') === 'false'?false:true;
    conference = new Owt.Conference.ConferenceClient();
    function createResolutionButtons(stream, subscribeResolutionCallback) {
        let $p = $(`#${stream.id}resolutions`);
        if ($p.length === 0) {
            $p = $(`<div class="btn-parent" id=${stream.id}resolutions> </div>`);
            $p.appendTo($('body'));
        }
        // Resolutions from settings.
        for (const videoSetting of stream.settings.video) {
            const resolution = videoSetting.resolution;
            if (resolution) {
                const button = $('<button/>', {
                    text: resolution.width + 'x' +
                        resolution.height,
                    click: () => {
                        subscribeResolutionCallback(stream, resolution);
                    }
                });
                button.prependTo($p);
            }
        }
        // Resolutions from extraCapabilities.
        for (const resolution of stream.extraCapabilities.video.resolutions.reverse()) {
            const button = $('<button/>', {
                text: resolution.width + 'x' +
                    resolution.height,
                click: () => {
                    subscribeResolutionCallback(stream, resolution);
                }
            });
            button.prependTo($p);
        };
        return $p;
    }
    function subscribeAndRenderVideo(stream){
        let subscirptionLocal=null;
        function subscribeDifferentResolution(stream, resolution){
            subscirptionLocal && subscirptionLocal.stop();
            subscirptionLocal = null;
            const videoOptions = {};
            videoOptions.resolution = resolution;
            conference.subscribe(stream, {
                audio: true,
                video: videoOptions
            }).then((
                subscription) => {
                    subscirptionLocal = subscription;
                $(`#${stream.id}`).get(0).srcObject = stream.mediaStream;
            });
        }
        let $p = createResolutionButtons(stream, subscribeDifferentResolution);
        conference.subscribe(stream)
        .then((subscription)=>{
            if(stream.source.video ===
                'mixed'){
                    subscirptionLocal = subscription;
                    let $video = $(`<video muted autoplay id=${stream.id} style="display:block" >this browser does not supported video tag</video>`);
                   $video.get(0).srcObject = stream.mediaStream;
                   let $header = $(`<h2>OUTPUT VIDEO</h2>`);
                   $p.append($header)
                   $p.append($video);
                }else{
                    let $video = $(`<video style="width:160px;height:120px;" muted  autoplay id=${stream.id} style="display:block" >this browser does not supported video tag</video>`);
                    $video.get(0).srcObject = stream.mediaStream;
                    $('#remotevideos').append($video)
                    $video.get(0).onclick = ()=>{
                        
                        if(!window.streamstat){
                            window.streamstat = {};
                        }
                        if(window.streamstat[stream.id]){
                            delete window.streamstat[stream.id]
                            unmixStream(myRoom, stream.id, 'common');
                        }else{
                            window.streamstat[stream.id] = true;
                            mixStream(myRoom, stream.id, 'common');
                        }
                        
                        
                    }
                }
            
        }, (err)=>{ console.log('subscribe failed', err);
        });
        stream.addEventListener('ended', () => {
            removeUi(stream.id);
            $(`#${stream.id}resolutions`).remove();
        });
        stream.addEventListener('updated', () => {
            // Update resolution buttons
            $p.children('button').remove();
            createResolutionButtons(stream, subscribeDifferentResolution);
        });
    }
    
    function removeUi(id){
        $(`#${id}`).remove();
    }

    conference.addEventListener('streamadded', (event) => {
        console.log('A new stream is added ', event.stream.id);
        isSelf = isSelf?isSelf:event.stream.id != publicationGlobal.id;
        // subscribeForward && isSelf && subscribeAndRenderVideo(event.stream);
        // mixStream(myRoom, event.stream.id, 'common');
        if ((event.stream.source.audio === 'mixed' && event.stream.source.video ===
                        'mixed') || org) {
            subscribeAndRenderVideo(event.stream);
        }
        event.stream.addEventListener('ended', () => {
            console.log(event.stream.id + ' is ended.');
        });
    });


    window.onload = function() {
        var simulcast = getParameterByName('simulcast') || false;
        var shareScreen = getParameterByName('screen') || false;
        myRoom = '60bb6b40ea37a84b09e47f45';//getParameterByName('room');
        var isHttps = (location.protocol === 'https:');
        var mediaUrl = getParameterByName('url');
        var isPublish = getParameterByName('publish');
        createToken(myRoom, 'user', 'presenter', function(response) {
            var token = response;
            conference.join(token).then(resp => {
                myId = resp.self.id;
                myRoom = resp.id;
                if(mediaUrl){
                     startStreamingIn(myRoom, mediaUrl);
                }
                if (isPublish !== 'false' && org === false) {
                    // audioConstraintsForMic
                    let audioConstraints = new Owt.Base.AudioTrackConstraints(Owt.Base.AudioSourceInfo.MIC);
                    // videoConstraintsForCamera
                    let videoConstraints = new Owt.Base.VideoTrackConstraints(Owt.Base.VideoSourceInfo.CAMERA);
                    if (shareScreen) {
                        // audioConstraintsForScreen
                        audioConstraints = new Owt.Base.AudioTrackConstraints(Owt.Base.AudioSourceInfo.SCREENCAST);
                        // videoConstraintsForScreen
                        videoConstraints = new Owt.Base.VideoTrackConstraints(Owt.Base.VideoSourceInfo.SCREENCAST);
                    }

                    let mediaStream;
                    Owt.Base.MediaStreamFactory.createMediaStream(new Owt.Base.StreamConstraints(
                        audioConstraints, videoConstraints)).then(stream => {
                        let publishOption;
                        if (simulcast) {
                            publishOption = {video:[
                                {rid: 'q', active: true/*, scaleResolutionDownBy: 4.0*/},
                                {rid: 'h', active: true/*, scaleResolutionDownBy: 2.0*/},
                                {rid: 'f', active: true}
                            ]};
                        }
                        mediaStream = stream;
                        localStream = new Owt.Base.LocalStream(
                            mediaStream, new Owt.Base.StreamSourceInfo(
                                'mic', 'camera'));
                        $('.local video').get(0).srcObject = stream;
                        conference.publish(localStream, publishOption).then(publication => {
                            publicationGlobal = publication;
                            // mixStream(myRoom, publication.id, 'common')
                            publication.addEventListener('error', (err) => {
                                console.log('Publication error: ' + err.error.message);
                            });
                        });
                    }, err => {
                        console.error('Failed to create MediaStream, ' +
                            err);
                    });
                }
                var streams = resp.remoteStreams;
                for (const stream of streams) {
                    if ((stream.source.audio === 'mixed' && stream.source.video ===
                        'mixed') || org) {
                        subscribeAndRenderVideo(stream);
                      }
                }
                console.log('Streams in conference:', streams.length);
                var participants = resp.participants;
                console.log('Participants in conference: ' + participants.length);
            }, function(err) {
                console.error('server connection failed:', err);
                if (err.message.indexOf('connect_error:') >= 0) {
                    const signalingHost = err.message.replace('connect_error:', '');
                    const signalingUi = 'signaling';
                    removeUi(signalingUi);
                    let $p = $(`<div id=${signalingUi}> </div>`);
                    const anchor = $('<a/>', {
                        text: 'Click this for testing certificate and refresh',
                        target: '_blank',
                        href: `${signalingHost}/socket.io/`
                    });
                    anchor.appendTo($p);
                    $p.appendTo($('body'));
                }
            });
        });
    };
};
window.onbeforeunload = function(event){
    conference.leave()
    publicationGlobal.stop();
}
