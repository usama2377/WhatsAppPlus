$(document).ready(function () {
    $(document).on('click', '.contact', function () {
        $('.chat-head').show()
        $('.wrap-chat').show()
        $('.wrap-message').show()
        $('.chatCover').hide()
        $('.chat-name').find('.font-name').text($(this).find('.font-name').text())
        $('.chat').empty()
        $('.active-contact').removeClass('active-contact')
        $('#imgupload').val('')
        $('.input-message').val('')
        $('.input-message').prop('disabled', false)
        $('.chat-head').attr('id', $(this).attr('id'))
        $('#deletebtn').remove()
        $('.cursor').remove()
        $('.chat').prepend(`<button type="button" class="btn btn-info load-message-Btn" >Load More Messages</button>`)

        $(this).addClass('active-contact')
        for (category of getCategories()) {
            if ($(this).attr('id') === category) {
                if (newMessages[category]) {
                    showMessages(newMessages[category], true)
                }
                updateSendersName()
                $(this).removeClass('new-message-contact')
                $(this).find('.new-message').remove()
                return
            }
        }
        jid = getCompleteJid($(this).attr('id').trim())
        socket.emit('chatRead', { jid: jid })

        console.log('receivedChats->', jid)

        messages = getReceivedChats().find((x) => x.jid === jid).messages

        showMessages(messages, false)
        // if (newMessages[jid]) {
        //   showMessages(newMessages[jid], false);
        // }
        updateSendersName()
        $(this).removeClass('new-message-contact')
        $(this).find('.new-message').remove()

        return
    })
    $(document).on('click', '.load-message-Btn', function () {
        if ($('.loader').length == 0) {
            $('.chat').prepend(`<div class="loader"></div>`)
        }

        $('.load-message-Btn').remove()
        msgcursor = {}
        if ($('.cursor').length != 0) {
            msgcursor['id'] = $('.cursor').text()
            msgcursor['fromMe'] = $('.cursor').prop('id') === 'true'
        }
        console.log(msgcursor)
        $.ajax({
            url: 'http://localhost:8000/loadMessages',
            type: 'POST',
            data: {
                jid: getCompleteJid($('.active-contact').prop('id')),
                cursor: msgcursor,
            },
            success: function (data) {
                $('.loader').remove()
                data = JSON.parse(data)
                console.log(data)
                prependChatBoxMessages(data.messages, false, data.cursor)

                $('.chat').prepend(
                    `<button type="button" class="btn btn-info load-message-Btn" >Load More Messages</button>`,
                )
            },
        })
    })

    $(document).on('click', '.chat-bubble', function () {
        $('.chat-bubble').removeClass('active-message')
        $(this).addClass('active-message')
    })

    $(document).on('click', '#recordButton', function () {
        console.log('recordButton clicked')
        var constraints = { audio: true, video: false }
        $('#recordButton').hide()
        $('#stopButton').show()

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
                console.log('getUserMedia() success, stream created, initializing Recorder.js ...')

                audioContext = new AudioContext()

                gumStream = stream

                /* use the stream */
                input = audioContext.createMediaStreamSource(stream)

                rec = new Recorder(input, { numChannels: 1 })

                //start the recording process
                rec.record()

                console.log('Recording started')
            })
            .catch(function (err) {
                //enable the record button if getUserMedia() fails
                console.log(err)
                $('#recordButton').show()
                $('#stopButton').hide()
            })
    })

    $(document).on('click', '#stopButton', function () {
        console.log('stopButton clicked')
        $('#recordButton').show()
        $('#stopButton').hide()
        $('.input-message').val('Audio Message ready to send')
        $('.input-message').css('color', 'green')
        $('.input-message').prop('disabled', true)
        $(
            '.message',
        ).prepend(`<i class="fa fa-trash fa-lg" aria-hidden="true" style="cursor: pointer" id="deletebtn" ></i>
              `)
        rec.stop()

        //stop microphone access
        gumStream.getAudioTracks()[0].stop()

        //create the wav blob and pass it on to createDownloadLink
        rec.exportWAV(function (data) {
            blob = data
        })
    })

    $('#OpenImgUpload').click(function () {
        $('#imgupload').trigger('click')
    })

    $('.input-search').on('input', function (e) {
        $('.contact-list').empty()
        if ($('.input-search').val() === '') {
            addCategoriesChatBox(getCategories())
            populateContactList(getReceivedChats())
        } else {
            addCategoriesChatBox(getCategories())

            matchedChats = getChats($('.input-search').val().toLowerCase())
            populateContactList(matchedChats)
        }
    })

    $(document).on('click', '#deletebtn', function () {
        $('#imgupload').val('')
        $('.input-message').val('')
        $('.input-message').prop('disabled', false)

        $(this).remove()
    })
    $('#imgupload').change(function () {
        $('#deletebtn').remove()
        let file = $('#imgupload').prop('files')[0]
        if (file != undefined) {
            $('.message')
                .prepend(`<i class="fa fa-trash fa-lg" aria-hidden="true" style="cursor: pointer" id="deletebtn" ></i>
          `)
            $('.input-message').val('Selected File: ' + file.name)
            $('.input-message').css('color', 'green')
            $('.input-message').prop('disabled', true)
        }
    })
    $('#send-message').click(function (event) {
        prepareMsg()
    })
    $('.input-message').keydown(function (event) {
        if (event.key === 'Enter') {
            prepareMsg()
        }
    })
})
