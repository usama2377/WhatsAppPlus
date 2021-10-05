import {
    WAConnection,
    MessageType,
    Mimetype,
    ReconnectMode,
    waChatKey,
    extensionForMediaMessage,
} from '../src/WAConnection'

const fs = require('fs')

const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const path = require('path')
const formidable = require('formidable')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html')
})
app.post('/loadMessages', async function (req, res) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    let messages
    let cursor
    let result
    if (req.body.cursor) {
        result = await conn.loadMessages(req.body.jid, 25, {
            id: req.body.cursor.id,
            fromMe: req.body.cursor.fromMe === 'true',
        })
        cursor = result.cursor
        messages = result.messages
    } else {
        result = await conn.loadMessages(req.body.jid, 25)
        cursor = result.cursor
        messages = result.messages
    }

    let data = { messages: messages, cursor: cursor }
    res.end(JSON.stringify(data))
    for (const m of messages) {
        console.log(messages)
        downloadMedia(m.toJSON())
    }
})

app.post('/fileUpload', function (req, res) {
    var form = new formidable.IncomingForm()
    let data = {}
    var filePath = ''
    let timestamp

    form.parse(req, function (err, fields, files) {
        data = fields
    })

    form.on('fileBegin', function (name, file) {
        timestamp = new Date()
        let ext = file.name.split('.').pop()
        let filename = file.name.split('@')[0] + '_' + ((timestamp / 1000) | 0) + '.' + ext
        file.path = __dirname + '/public/Media/' + filename
        filePath = file.path
    })

    form.on('file', function (name, file) {
        console.log('Uploaded ' + file.name)
    })
    form.on('end', async function () {
        if (data.msgType === 'TextMessage') {
            await conn.sendMessage(data.remoteJid, data.text, MessageType.text)
        } else if (data.msgType === 'RecordedAudioMessage') {
            await conn.sendMessage(
                data.remoteJid,
                { url: filePath }, // can send mp3, mp4, & ogg
                MessageType.audio,
                { mimetype: Mimetype.mpeg, ptt: true, timestamp: timestamp }, // some metadata (can't have caption in audio)
            )
        } else if (data.msgType === 'AudioMessage') {
            await conn.sendMessage(
                data.remoteJid,
                { url: filePath }, // can send mp3, mp4, & ogg
                MessageType.audio,
                { mimetype: Mimetype.mpeg, timestamp: timestamp },
                // some metadata (can't have caption in audio)
            )
        } else if (data.msgType === 'ImageMessage') {
            await conn.sendMessage(
                data.remoteJid,
                { url: filePath }, // can send mp3, mp4, & ogg
                MessageType.image,
                { mimetype: Mimetype.jpeg, timestamp: timestamp }, // some metadata (can't have caption in audio)
            )
        } else if (data.msgType === 'VideoMessage') {
            await conn.sendMessage(
                data.remoteJid,
                { url: filePath }, // can send mp3, mp4, & ogg
                MessageType.video,
                { mimetype: Mimetype.mp4, timestamp: timestamp }, // some metadata (can't have caption in audio)
            )
        } else if (data.msgType === 'DocumentMessage') {
            await conn.sendMessage(
                data.remoteJid,
                { url: filePath }, // can send mp3, mp4, & ogg
                MessageType.document,
                // some metadata (can't have caption in audio)
                { mimetype: Mimetype.pdf, timestamp: timestamp },
            )
        } else {
            await conn.sendMessage(
                data.remoteJid,
                { url: filePath }, // can send mp3, mp4, & ogg
                MessageType.document,
                // some metadata (can't have caption in audio)
            )
        }

        res.end('{"success" : "Updated Successfully", "status" : 200}')
    })
})

server.listen(8000, () => {
    console.log('listening on *:8000')
})

const conn = new WAConnection()

async function sendContacts() {
    let contacts = []
    if (conn.contacts.length) {
        contacts = conn.contacts
        console.log('contacts sent!!!')
    } else {
        contacts = conn.contacts
        conn.getContacts()
        console.log('Waiting for contacts!!!')
    }
    io.emit('contacts', { contacts: contacts })
}

async function sendChats() {
    let chats = []
    let count = 0
    if (conn.chats.length != 0) {
        chats = conn.chats
        io.emit('chats', { chats: chats })
        console.log('chats sent!!!')

        for (const chat of conn.chats.toJSON()) {
            if (chat.messages.length == 0) {
                count++
            }
            for (const m of chat.messages.toJSON()) {
                downloadMedia(m.toJSON())
            }
        }
        if (count >= 15) {
            conn.getChats()
            console.log('getchats called')
        }
    } else {
        conn.getChats()

        console.log('Waiting for chats!!!')
    }
    io.emit('chats', { chats: chats })
}

function readCategories() {
    try {
        let categories = []
        const data = fs.readFileSync(__dirname + '/categories.txt', 'utf8').split('\n')

        for (let category of data) {
            category = category.replace('\r', '')
            if (category.trim() != '') {
                categories.push(category.toLowerCase())
            }
        }
        return categories
    } catch (err) {
        console.log(err)
        return categories
    }
}

function readIgnoreList() {
    try {
        let categories = []
        const data = fs.readFileSync(__dirname + '/ignoreList.txt', 'utf8').split('\n')
        for (let category of data) {
            category = category.replace('\r', '')
            if (category.trim() != '') {
                categories.push(category.toLowerCase())
            }
        }
        return categories
    } catch (err) {
        console.log(err)
        return categories
    }
}
async function downloadMedia(m) {
    if (m.message != undefined) {
        if (m.key.remoteJid == undefined) {
            console.log(m)
            return
        }
        const messageType = Object.keys(m.message)[0]
        if (messageType !== MessageType.text && messageType !== MessageType.extendedText) {
            let extension
            try {
                extension = extensionForMediaMessage(m.message)
            } catch (err) {
                console.log('Media no longer available')
                return
            }
            let timestamp = m.messageTimestamp
            let filename = __dirname + '\\public\\Media\\' + m.key.remoteJid.split('@')[0] + '_' + timestamp
            try {
                if (!fs.existsSync(filename + '.' + extension)) {
                    var savedFilename = await conn.downloadAndSaveMediaMessage(m, filename)
                    console.log('File Downloaded-', savedFilename)
                    io.emit('NewMediaPath', {
                        path: savedFilename,
                    })
                } else {
                    console.log('already exists', filename + '.' + extension)
                }
            } catch (err) {}
        }
    }
}
io.on('connection', async (socket) => {
    io.emit('categories', { categories: readCategories() })
    io.emit('ignoreList', { ignoreList: readIgnoreList() })

    sendChats()
    sendContacts()
    socket.on('chatRead', async (msg) => {
        conn.chatRead(msg.jid)
    })

    conn.on('contacts-received', async () => {
        let contacts = conn.contacts
        io.emit('contacts', { contacts: contacts })
        console.log('contacts sent!!!')
    })

    conn.on('chats-received', async ({ hasNewChats }) => {
        let chats = conn.chats
        io.emit('chats', { chats: chats })
        console.log('chats sent!!!')
        let count = 0

        for (const chat of conn.chats.toJSON()) {
            if (chat.messages.length == 0) {
                count++
            }
            for (const m of chat.messages.toJSON()) {
                downloadMedia(m.toJSON())
            }
        }
        if (count >= 10) {
            conn.getChats()
            console.log('getchats called')
        }
    })
    const unread = await conn.loadAllUnreadMessages()

    io.emit('unreadMessages', {
        unreadMessages: unread,
    })
})

async function example() {
    // instantiate
    conn.autoReconnect = ReconnectMode.onAllErrors // only automatically reconnect when the connection breaks
    conn.logger.level = 'debug' // set to 'debug' to see what kind of stuff you can implement
    // attempt to reconnect at most 10 times in a row
    conn.connectOptions.maxRetries = 10000000

    conn.chatOrderingKey = waChatKey(true) // order chats such that pinned chats are on top
    conn.on('ws-close', (err) => {
        io.emit('error', { error: err.reason })
        console.log(err) // save this info to a file
    })
    conn.on('chat-new', (chat) => {
        io.emit('chats', { chats: conn.chats })
    })

    if (fs.existsSync(__dirname + '/auth_info.json')) {
        console.log(__dirname + '/auth_info.json')
        conn.loadAuthInfo(__dirname + '/auth_info.json')
    }

    conn.on('open', () => {
        // save credentials whenever updated
        console.log(`credentials updated!`)
        const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
        fs.writeFileSync(__dirname + '/auth_info.json', JSON.stringify(authInfo, null, '\t'))
        io.emit('connectedToServer', { data: 'Your Phone is Connected Now!!' })
    })
    await conn.connect()

    try {
        conn.on('chat-update', async (chat) => {
            if (!chat.hasNewMessage) {
                return
            }

            const m = chat.messages.all()[0]

            let notificationType

            if (m.messageStubType == 0 || (m.messageStubType == undefined && m.message != undefined)) {
                notificationType = Object.keys(m.message)[0]
            } else {
                notificationType = m.messageStubType
            }

            console.log('Got notification of type: ' + notificationType)
            if (Number.isInteger(notificationType)) {
                console.log(m)
                return
            }

            const messageType = Object.keys(m.message)[0] // get what type of message it is -- text, image, video
            // if the message is not a text message
            if (messageType !== MessageType.text && messageType !== MessageType.extendedText) {
                downloadMedia(m)
            }

            io.emit('new_message', { data: m })
        })
    } catch (e) {
        console.log(e) // [Error]
    }

    /* example of custom functionality for tracking battery */
    conn.on('CB:action,,battery', (json) => {
        const batteryLevelStr = json[2][0][1].value
        const batterylevel = parseInt(batteryLevelStr)
        console.log('battery level: ' + batterylevel)
    })

    conn.on('CB:Chat', (json) => {
        console.log('new Chat--->', json)
        io.emit('new_chat', { data: json })
    })

    conn.on('close', ({ reason, isReconnecting }) =>
        console.log('oh no got disconnected: ' + reason + ', reconnecting: ' + isReconnecting),
    )
}

example().catch((err) => console.log(`encountered error: ${err}`))
