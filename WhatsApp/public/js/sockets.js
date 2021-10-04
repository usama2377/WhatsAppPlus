$(document).ready(function () {
    //   console.log(moment(1628185962 * 1000).calendar())
    receivedChats = []
    receivedContacts = []
    newMessages = []
    crmMessages = []
    kpkMessages = []
    paymentMessages = []
    ignoreList = []
    categories = []
    blob = null
    URL = window.URL || window.webkitURL

    var gumStream //stream from getUserMedia()
    var rec //Recorder.js object
    var input //MediaStreamAudioSourceNode we'll be recording

    // shim for AudioContext when it's not avb.
    var AudioContext = window.AudioContext || window.webkitAudioContext
    var audioContext //audio context to help us record

    $('.chat-head').hide()
    $('.wrap-chat').hide()
    $('.wrap-message').hide()
    $('.chatCover').show()
    socket = io()
    chatElement = `<div  id="cover"><div class="contact" id="">
    <img
      src="images/contact3.jpg"
      alt="profilpicture"
    />
    <div class="contact-preview">
      <div class="contact-text">
        <h6 class="font-name"></h6>
      <p class="font-preview"></p>
     
    
   
      </div>
    </div>
    <div class="contact-time">
      <p class="time"></p>
    </div>
  </div></div>`

    socket.on('categories', function (msg) {
        categories = msg.categories
        addCategoriesChatBox(categories)
    })

    socket.on('ignoreList', function (msg) {
        ignoreList = msg.ignoreList
        console.log('ignore list', ignoreList)
    })

    socket.on('contacts', function (msg) {
        if (msg.contacts.length == 0) {
            console.log('Waiting for contacts!!!')
            return
        }
        receivedContacts = msg.contacts
        console.log('contacts received')
        updateSendersName()
    })

    socket.on('unreadMessages', function (msg) {
        console.log('unreadMessages received')
    })
    socket.on('chat-new', function (msg) {
        console.log(msg)
    })

    socket.on('chats', function (msg) {
        if (msg.chats.length == 0) {
            console.log('Waiting for chats!!!')
            return
        }

        receivedChats = msg.chats.filter(notStatusChat)
        console.log('chats received')
        $('.contact-list').empty()
        addCategoriesChatBox(getCategories())
        populateContactList(getReceivedChats())
    })

    socket.on('new_message', function (msg, cb) {
        if (msg.data.key.remoteJid === 'status@broadcast') {
            console.log('status@broadcast message found')
            return
        }
        console.log(msg)
        chatTitle = getChatName(msg.data.key.remoteJid)

        if (!chatTitle) {
            chatTitle = msg.data.key.remoteJid
        }

        for (category of getCategories()) {
            if (chatTitle.toLowerCase().includes(category) && msg.data.key.remoteJid.endsWith('@g.us')) {
                if (!msg.data.key.fromMe) {
                    if ($('#' + category + ' .count').length == 0) {
                        $('#' + category).addClass('new-message-contact')
                        $('#' + category + ' .contact-time').append(`<div class="new-message" ><span class="count">
                      1</span></div>`)
                    } else {
                        count = 0
                        count = parseInt($('#' + category + ' .count').text())
                        console.log(count)
                        count += 1
                        $('#' + category + '  .new-message').remove()
                        $('#' + category).addClass('new-message-contact')
                        $('#' + category + ' .contact-time').append(`<div class="new-message" ><span class="count">
                      ${count}</span></div>`)
                    }
                }
                console.log(msg.data.messageTimestamp)
                $('#' + category + ' .time').text(getDateTime(msg.data.messageTimestamp))

                if (msg.data.key.remoteJid.includes('@g.us')) {
                    if (msg.data.key.fromMe) {
                        $('#' + category + ' .font-preview').text('You: ' + getMessageText(msg.data))
                    } else {
                        if (msg.data.participant) {
                            lastSender = msg.data.participant.replace('@s.whatsapp.net', '')

                            $('#' + category + ' .font-preview').text(lastSender + ': ' + getMessageText(msg.data))
                        }
                    }
                } else {
                    $('#' + category + ' .font-preview').text(getMessageText(msg.data))
                }

                appendchatBoxMessage(msg.data, category, true)
                appendCategoryMessages(msg, category)
                updateSendersName()
                break
            }
        }

        count = 0
        jid = msg.data.key.remoteJid
        jid = jid.replace('@g.us', '')
        jid = jid.replace('@s.whatsapp.net', '')
        msgId = jid
        if (!msg.data.key.fromMe) {
            playSound()
            if ($('#' + jid + ' .new-message').length > 0) {
                count = parseInt($('#' + jid + ' .count').text())
                count++
            } else {
                count = 1
            }
        }

        let selected = false
        selected = $('#' + jid).hasClass('active-contact')

        $('#' + jid).remove()

        element = htmlToElement(
            chatElement,
            msg.data.key.remoteJid,
            count,
            getDateTime(msg.data.messageTimestamp),
            chatTitle,
            msg.data,
        )

        if (isIgnoreChat(chatTitle)) {
            $('.contact-list').append(element)
            if (selected) {
                jid = getHalfJid(msg.data.key.remoteJid)
                $('#' + jid).addClass('active-contact')
                appendchatBoxMessage(msg.data, getHalfJid(msg.data.key.remoteJid), false)

                appendMessages(msg, msg.data.key.remoteJid)
            }
            console.log('Ignoring chat- ', chatTitle)
            return
        }
        $('.contact-list > div:nth-child(' + getCategories().length + ')').after(element)

        if (selected) {
            $('#' + jid).addClass('active-contact')
        }
        appendchatBoxMessage(msg.data, getHalfJid(msg.data.key.remoteJid), false)

        appendMessages(msg, msg.data.key.remoteJid)

        updateSendersName()
    })

    socket.on('NewMediaPath', function (msg) {
        var path = msg.path
        path = path.split('\\').at(-1)
        console.log(path)
        if ($(`img[src$='Media/${path}']`).length == 0) {
            media = $(`audio [src$='Media/${path}']`)
            $(media).parent().attr('src', `Media/${path}`)
        } else {
            media = $(`img[src$='Media/${path}']`)
            media.attr('src', `Media/${path}`)
        }
    })

    socket.on('new_chat', function (msg) {
        console.log('new Chat--->', msg)
        if (msg.data[1]) {
            if (msg.data[1]['data']) {
                if (msg.data[1]['data'][0] == 'create') {
                    console.log(
                        msg.data[1]['id'],
                        msg.data[1]['data'][2]['subject'],
                        msg.data[1]['data'][2]['creation'],
                    )
                }
            }
        }
    })

    socket.on('error', function (msg) {
        console.log('Error-->', msg.error)
        var options = {
            message: msg.error,
            color: 'danger',
            timeout: null,
        }
        notify(options)
    })
    socket.on('reconnect', function () {})
    socket.on('reconnect_failed', function () {
        console.log('reconnect_failed')
    })
    socket.on('connect_failed', function () {
        console.log('Sorry, there seems to be an issue with the connection!')
    })

    socket.on('connectedToServer', function (msg) {
        console.log('connectedToServer!!')

        var options = {
            message: msg.data,
            color: 'success',
            timeout: 3000,
        }
        notify(options)
    })

    socket.on('connect', function () {
        console.log('connected!!')

        var options = {
            message: 'Your Phone is Connected Now!!',
            color: 'success',
            timeout: 3000,
        }
        notify(options)
    })

    socket.on('connect_error', function (err) {
        // handle server error here
        console.log('Error connecting to server')

        var options = {
            message: 'Error Connecting to WAPlus Server!!',
            color: 'danger',
            timeout: null,
        }
        notify(options)
    })

    socket.on('disconnect', function () {
        console.log('disconnected')
    })
})
