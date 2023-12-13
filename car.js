class Car{
    constructor(x,y,width,height, controlType, maxSpeed=3){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = controlType == 'AI';

        if(controlType != 'DUMMY'){
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork(
                [this.sensor.rayCount, 6, 4]
            );
        }
        this.controls = new Controls(controlType);
    }
    
    #move(){
        if(this.controls.forward){
            this.speed += this.acceleration;
        }
        if(this.controls.reverse){
            this.speed -= this.acceleration;
        }

        if(this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
        if(this.speed < -this.maxSpeed/2){
            this.speed = -this.maxSpeed/2;
        }

        if(this.speed > 0){
            this.speed -= this.friction;
        }
        if(this.speed < 0){
            this.speed += this.friction;
        }

        if(Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }

        if(this.speed != 0){
            const flip = this.speed > 0 ? 1 : -1;
           
            if(this.controls.left){
                this.angle += 0.03 * flip;
            }
            if(this.controls.right){
                this.angle -= 0.03 * flip;
            }
        }

        this.x -= this.speed * Math.sin(this.angle);
        this.y -= this.speed * Math.cos(this.angle);
    }

    update(roadBorders, traffic){
        if(!this.damaged){
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
        }
        if(this.sensor){
            this.sensor.update(roadBorders, traffic);
            const offsets = this.sensor.readings.map(reading => reading ? 1 - reading.offset : 0);
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            console.log(outputs);

            if(this.useBrain){
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    #assessDamage(roadBorders, traffic){
        let hasDamage = false;

        roadBorders.forEach((border) => {
            if(hasPolysIntersect(this.polygon, border)) hasDamage = true;
        });
        traffic.forEach((car) => {
            if(hasPolysIntersect(this.polygon, car.polygon)) hasDamage = true;
        });

        return hasDamage;
    }

    #createPolygon(){
        const points = [];
        const rad = Math.hypot(this.width, this.height)/2;
        const alpha = Math.atan2(this.width, this.height);

        points.push({
            x : this.x - rad * Math.sin(this.angle - alpha),
            y : this.y - rad * Math.cos(this.angle - alpha)
        });
        points.push({
            x : this.x - rad * Math.sin(this.angle + alpha),
            y : this.y - rad * Math.cos(this.angle + alpha)
        });
        points.push({
            x : this.x - rad * Math.sin(Math.PI + this.angle - alpha),
            y : this.y - rad * Math.cos(Math.PI + this.angle - alpha)
        });
        points.push({
            x : this.x - rad * Math.sin(Math.PI + this.angle + alpha),
            y : this.y - rad * Math.cos(Math.PI + this.angle + alpha)
        });

        return points;
    }

    draw(ctx, color){
        if(this.damaged){
            ctx.fillStyle = 'gray';
        }else{
            ctx.fillStyle = color;
        }
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for(let i = 1; i < this.polygon.length; i++){
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();

        if(this.sensor) this.sensor.draw(ctx);
    }
}