
// https://discord.com/oauth2/authorize?client_id=849738765265272892&scope=bot&permissions=11328

const Discord = require("discord.js");
const gpm = require("@jingwood/graphics-math");


const client = new Discord.Client();

client.once("ready", () => {
    console.log("Online");
})

const filter = (reaction, user) => {
    return ['⬅️', '➡️', '⬆️', '⬇️', '🎥', '⏫', '⏬', '◀️', '▶️', '🔼', '🔽'].includes(reaction.emoji.name);
};

/** @type {Discord.Message} */
var incMesssage = null;

/**
 * 
 * @param {Number} value 
 * @param {Number[]} from 
 * @param {Number[]} to 
 * @returns {Number}
 */
const remap = function (value, from, to) {
    return to[0] + (value - from[0]) * (to[1] - to[0]) / (from[1] - from[0]);
}

class Line2D {
    /**
     * 
     * @param {gpm.Vec2} from 
     * @param {gpm.Vec2} to 
     */
    constructor(from, to) {
        this.from = from;
        this.to = to;

        this.maxDistance = 0.50001;
    }

    distance() {
        return gpm.MathFunctions2.distancePointToPoint(this.from, this.to);
    }

    isOnLine(point) {
        if (gpm.MathFunctions2.distancePointToPoint(point, this.to) > this.distance())
            return false;

        if (gpm.MathFunctions2.distancePointToPoint(point, this.from) > this.distance())
            return false;

        return gpm.MathFunctions2.distancePointToLine(point, { start: this.from, end: this.to }) < this.maxDistance;
    }
}

class Object3D {
    constructor() {
        this.points = [
            new gpm.Vec3(-1.0, -1.0, -1.0),
            new gpm.Vec3(-1.0, -1.0, 1.0),
            new gpm.Vec3(-1.0, 1.0, -1.0),
            new gpm.Vec3(-1.0, 1.0, 1.0),
            new gpm.Vec3(1.0, -1.0, -1.0),
            new gpm.Vec3(1.0, -1.0, 1.0),
            new gpm.Vec3(1.0, 1.0, -1.0),
            new gpm.Vec3(1.0, 1.0, 1.0)
        ];

        this.lines = [
            [0, 1],
            [0, 2],
            [0, 4],
            [3, 2],
            [3, 1],
            [3, 7],
            [5, 1],
            [5, 7],
            [5, 4],
            [6, 2],
            [6, 4],
            [6, 7]
        ];

        this.modelMat = new gpm.Matrix4().loadIdentity();
    }

    getModelMat() {
        return this.modelMat;
    }

    /**
     * 
     * @param {gpm.Matrix4} viewMat 
     * @param {gpm.Matrix4} ProjectionMat 
     * @returns {Line2D[]}
     */
    getNormalLines(viewMat, ProjectionMat) {
        /** @type {gpm.Vec3[]} */
        let movedPoints = new Array();
        for (const p of this.points) {
            let normalP = new gpm.Vec4(p.x, p.y, p.z, 1);
            normalP = normalP.mulMat(this.getModelMat());
            normalP = normalP.mulMat(viewMat);
            normalP = normalP.mulMat(ProjectionMat);
            movedPoints.push(new gpm.Vec3(
                normalP.x / normalP.w,
                normalP.y / normalP.w,
                normalP.z / normalP.w));
        }

        /** @type {Line2D[]} */
        let list = new Array();
        for (const l of this.lines) {
            let fromPoint = movedPoints[l[0]];
            let toPoint = movedPoints[l[1]];



            list.push(new Line2D(new gpm.Vec2(fromPoint.x, fromPoint.y), new gpm.Vec2(toPoint.x, toPoint.y)));
        }
        return list;
    }
}

class Camera {
    constructor() {
        this.viewMat = new gpm.Matrix4().loadIdentity();
        this.projectionMat = new gpm.Matrix4().perspective(gpm.MathFunctions.degreeToAngle(45), 17 / 9, 0.1, 100);

        this.viewMat.translate(0.1, 0, -3.5);
    }
}


class Renderer {
    /**
     * @param {Discord.Message} msg
     */
    constructor(msg) {
        this.Message = msg;

        this.height = 21;
        this.width = 90;

        this.cube = new Object3D();
        this.camera = new Camera();

        this.resetReactions();

        let collector = this.Message.createReactionCollector(filter);
        collector.on("collect", (/** @type {Discord.MessageReaction} */ r) => this.handleReaction(r));
        collector.on("end", () => console.log("Collector Ended"));

        this.render();
    }

    resetReactions() {
        this.Message.reactions.removeAll();
        this.Message.react('⬅️')
            .then(() => this.Message.react('➡️'))
            .then(() => this.Message.react('⬆️'))
            .then(() => this.Message.react('⬇️'))
            .then(() => this.Message.react('🎥'))
            .then(() => this.Message.react('⏫'))
            .then(() => this.Message.react('⏬'))
            .then(() => this.Message.react('◀️'))
            .then(() => this.Message.react('▶️'))
            .then(() => this.Message.react('🔼'))
            .then(() => this.Message.react('🔽'))
            ;
    }


    handleReaction(/** @type {Discord.MessageReaction} */reaction) {
        if (reaction.me)
            return;


        switch (reaction.emoji.name) {
            case '⬅️':
                this.cube.modelMat.rotateY(gpm.MathFunctions.degreeToAngle(-14.3));
                break;

            case '➡️':
                this.cube.modelMat.rotateY(gpm.MathFunctions.degreeToAngle(14.3));
                break;

            case '⬆️':
                this.cube.modelMat.rotateX(gpm.MathFunctions.degreeToAngle(14.3));
                break;

            case '⬇️':
                this.cube.modelMat.rotateX(gpm.MathFunctions.degreeToAngle(-14.3));
                break;


            case '🎥':
                break;
            case '⏫':
                this.camera.viewMat.translate(0, 0, 0.3);
                break;
            case '⏬':
                this.camera.viewMat.translate(0, 0, -0.3);
                break;
            case '◀️':
                this.camera.viewMat.translate(0.3, 0, 0);
                break;
            case '▶️':
                this.camera.viewMat.translate(-0.3, 0, 0);
                break;
            case '🔼':
                this.camera.viewMat.translate(0, 0.3, 0);
                break;
            case '🔽':
                this.camera.viewMat.translate(0, -0.3, 0);
                break;
        }

        this.render();


        reaction.users.fetch().then(
            users => users.forEach(user => {
                if (!user.bot) {
                    reaction.users.remove(user);
                }
            }));
    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Line2D[]} screenLines 
     * @returns {string}
     */
    selectCharForScreenPoint(x, y, screenLines) {
        for (let line of screenLines) {
            if (line.isOnLine(new gpm.Vec2(x, y)))
                return "#";
        }
        return " ";
    }
    /**
     * 
     * @param {Line2D[]} normalLines 
     * @returns {Line2D[]
     */
    convertNormalLinesToScreenLines(normalLines) {
        let screenLines = new Array();
        let fromMap = [-1, 1];
        let toMapX = [-0.001, this.width]
        let toMapY = [-0.001, this.height]

        for (const l of normalLines) {
            screenLines.push(
                new Line2D(
                    new gpm.Vec2(
                        remap(l.from.x, fromMap, toMapX),
                        remap(l.from.y, fromMap, toMapY)),
                    new gpm.Vec2(
                        remap(l.to.x, fromMap, toMapX),
                        remap(l.to.y, fromMap, toMapY))
                ));
        }

        return screenLines;
    }

    render() {
        let normalLines = this.cube.getNormalLines(this.camera.viewMat, this.camera.projectionMat);

        let screenLines = this.convertNormalLinesToScreenLines(normalLines);

        this.print(screenLines);
    }

    /**
     * @param {Line2D[]} screenLines 
     */
    print(screenLines) {
        let message = "```\n";
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                message += this.selectCharForScreenPoint(x, y, screenLines);
            }
            message += "\n";
        }
        message += "```";
        this.Message.edit(message);
    }
}


client.on('message', msg => {
    if (msg.content === '!cube') {

        msg.channel.send("-")
            .then(msg => {
                new Renderer(msg);
            });
    }
});

client.login(require("./token").token).catch(reason => console.log(reason));

