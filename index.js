
// https://discord.com/oauth2/authorize?client_id=849738765265272892&scope=bot&permissions=11328

const Discord = require("discord.js");
const gpm = require("@jingwood/graphics-math");


const client = new Discord.Client();

client.once("ready", () => {
    console.log("Online");
})

const filter = (reaction, user) => {
    return ['⬅️', '➡️', '⬆️', '⬇️', '🎥', '⏫', '⏬', '◀️', '▶️', '🔼', '🔽', '❌'].includes(reaction.emoji.name);
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

class Line3D {
    /**
     * 
     * @param {gpm.Vec3} from 
     * @param {gpm.Vec3} to 
     */
    constructor(from, to) {
        this.fromZ = from.z;
        this.toZ = to.z;

        this.from = new gpm.Vec2(from.x, from.y);
        this.to = new gpm.Vec2(to.x, to.y);

        this.maxDistance = 0.5000001;
    }

    distance() {
        return gpm.MathFunctions2.distancePointToPoint(this.from, this.to);
    }

    distanceToPoint(point) {
        return gpm.MathFunctions2.distancePointToLine(point, { start: this.from, end: this.to })
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
     * @returns {Line3D[]}
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

        /** @type {Line3D[]} */
        let list = new Array();
        for (const l of this.lines) {
            let fromPoint = movedPoints[l[0]];
            let toPoint = movedPoints[l[1]];



            list.push(new Line3D(fromPoint, toPoint));
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
        this.lineRenderMode = true;

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
            .then(() => this.Message.react('❌'))
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
                this.lineRenderMode = !this.lineRenderMode;
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
            case '❌':
                //this.remove();
                break;
        }

        //let startTime = new Date().getTime();
        this.render();
        //console.log(new Date().getTime()-startTime);

        reaction.users.fetch().then(
            users => users.forEach(user => {
                if (!user.bot) {
                    reaction.users.remove(user);
                }
            }));
    }

    remove() {
        this.Message.delete();
        //delete this;
    }

    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Line3D[]} screenLines 
     * @returns {string}
     */
    selectCharForScreenPoint(x, y, screenLines) {

        //screenLines.sort((a,b)=>{
        //
        //});

        let char = " ";
        for (let line of screenLines) {
            if (line.isOnLine(new gpm.Vec2(x, y))) {

                if (this.lineRenderMode) {
                    if (Math.abs(line.to.x - line.from.x) > Math.abs(line.to.y - line.from.y) * 2.2) {
                        let smallest = 1000;
                        let d;
                        d = line.distanceToPoint(new gpm.Vec2(x, y - 0.33));
                        if (d < smallest) {
                            char = "‾";
                            smallest = d;
                        }
                        d = line.distanceToPoint(new gpm.Vec2(x, y));
                        if (d < smallest) {
                            char = "─";
                            smallest = d;
                        }
                        d = line.distanceToPoint(new gpm.Vec2(x, y + 0.33));
                        if (d < smallest) {
                            char = "_";
                        }

                    } else {

                        let diffY = line.from.y - line.to.y;

                        let diffX = line.from.x - line.to.x;

                        diffX /= diffY;

                        let diffXNum = remap(diffX, [-3, 3], [0, 9]);

                        /*if (diffX < -2) {
                            char = "╱";
                        } else if (diffX > 2) {
                            char = "╲"
                        } else*/
                        if (diffX < -0.5) {
                            char = "╱";
                        } else if (diffX > 0.5) {
                            char = "╲";
                        } else {
                            let smallest = 1000;
                            let d;
                            d = line.distanceToPoint(new gpm.Vec2(x - 0.33, y));
                            if (d < smallest) {
                                char = "⎸";
                                smallest = d;
                            }
                            d = line.distanceToPoint(new gpm.Vec2(x, y));
                            if (d < smallest) {
                                char = "|";
                                smallest = d;
                            }
                            d = line.distanceToPoint(new gpm.Vec2(x + 0.33, y));
                            if (d < smallest) {
                                char = "⎹";
                            }
                        }
                    }
                }
                else {
                    return "#";
                }
                return char;
            }
        }
        return char;
    }
    /**
     * 
     * @param {Line3D[]} normalLines 
     * @returns {Line3D[]
     */
    convertNormalLinesToScreenLines(normalLines) {
        let screenLines = new Array();
        let fromMap = [-1, 1];
        let toMapX = [-0.001, this.width]
        let toMapY = [-0.001, this.height]

        for (const l of normalLines) {
            screenLines.push(
                new Line3D(
                    new gpm.Vec3(
                        remap(l.from.x, fromMap, toMapX),
                        remap(l.from.y, fromMap, toMapY),
                        l.fromZ),
                    new gpm.Vec3(
                        remap(l.to.x, fromMap, toMapX),
                        remap(l.to.y, fromMap, toMapY),
                        l.toZ)
                ));
        }

        return screenLines;
    }

    render() {
        let normalLines = this.cube.getNormalLines(this.camera.viewMat, this.camera.projectionMat);

        //let debugLines = [
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.9, -0.9)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.9, -0.9)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.8, -0.7)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.8, -0.7)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.7, -0.5)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.7, -0.5)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.6, -0.3)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.6, -0.3)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.5, -0.1)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.5, -0.1)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.4, 0.1)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.4, 0.1)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.3, 0.3)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.3, 0.3)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.2, 0.5)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.2, 0.5)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(-0.1, 0.7)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.1, 0.7)),
        //    new Line2D(new gpm.Vec2(0, -0.9), new gpm.Vec2(0.0, 0.9)),
        //]

        let screenLines = this.convertNormalLinesToScreenLines(normalLines);

        this.print(screenLines);
    }

    /**
     * @param {Line3D[]} screenLines 
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

