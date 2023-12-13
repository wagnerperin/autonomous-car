class Sensor{
    constructor(car){
        this.car = car;
        this.rayCount = 5;
        this.rayLength = 150;
        this.raySpread = Math.PI/2;

        this.rays = [];
        this.readings = [];
    }

    update(roadBorders, traffic){
        this.#castRays();
        this.readings = [];
        this.rays.forEach((ray) => {
            this.readings.push(this.#getReading(ray, roadBorders, traffic));
        });
    }

    #getReading(ray, roadBorders, traffic){
        let touches = [];
        roadBorders.forEach((border) => {
            const intersection = getIntersection(ray[0], ray[1], border[0], border[1]);
            if(intersection){
                touches.push(intersection);
            }
        });

        for(let i = 0; i < traffic.length; i++){
            const poly = traffic[i].polygon;
            for(let j = 0; j < poly.length; j++){
                const intersection = getIntersection(ray[0], ray[1], poly[j], poly[(j+1)%poly.length]);
                if(intersection){
                    touches.push(intersection);
                }
            }
        }

        if(touches.length == 0){
            return null;
        }else{
            const offsets = touches.map(touch => touch.offset);
            const closest = Math.min(...offsets);
            return touches.find(touch => touch.offset == closest);
        }
    }

    #castRays(){
        this.rays = [];
        for(let i = 0; i < this.rayCount; i++){
            let rayAngle = this.car.angle + lerp(
                this.raySpread/2, 
                -this.raySpread/2, 
                this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
            );
            
            const start = {
                x : this.car.x, 
                y : this.car.y
            };

            const end = {
                x : start.x - Math.sin(rayAngle) * this.rayLength,
                y : start.y - Math.cos(rayAngle) * this.rayLength
            };

            this.rays.push([start, end]);
        }
    }

    draw(ctx){
        this.rays.forEach((ray, i) => {
            let end = ray[1];
            if(this.readings[i]){
                end = this.readings[i];
            }
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'yellow';
            ctx.moveTo(ray[0].x, ray[0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.moveTo(ray[1].x, ray[1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

        });
    }
}