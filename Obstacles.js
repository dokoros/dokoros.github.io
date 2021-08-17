import { Group, Vector3 } from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { Explosion } from './Explosion.js';

class Obstacles{
    constructor(game){
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
		this.game = game;
		this.scene = game.scene;
        this.loadCandy();
		this.loadBird();
		this.tmpPos = new Vector3();
        this.explosions = [];
    }

    loadCandy(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        this.ready = false;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'candy.glb',
			// called when the resource is loaded
			gltf => {

                this.candy = gltf.scene.children[0];

                this.candy.name = 'candy';

				if (this.bird !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

                this.loadingBar.update('candy', xhr.loaded, xhr.total );
			
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}	

    loadBird(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'penguin.glb',
			// called when the resource is loaded
			gltf => {

                this.bird = gltf.scene.children[0];

                if (this.candy !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('bird', xhr.loaded, xhr.total );
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}

	initialize(){
        this.obstacles = [];
        
        const obstacle = new Group();
        
        obstacle.add(this.candy);
        
        this.bird.rotation.x = -Math.PI*0.5;
        this.bird.position.y = 7.5;
        obstacle.add(this.bird);

        let rotate=true;

        for(let y=5; y>-8; y-=2.5){
            rotate = !rotate;
            if (y==0) continue;
            const bird = this.bird.clone();
            bird.rotation.x = (rotate) ? -Math.PI*0.5 : 0;
            bird.position.y = y;
            obstacle.add(bird);
        
        }
        this.obstacles.push(obstacle);

        this.scene.add(obstacle);

        for(let i=0; i<3; i++){
            
            const obstacle1 = obstacle.clone();
            
            this.scene.add(obstacle1);
            this.obstacles.push(obstacle1);

        }

        this.reset();

		this.ready = true;
    }

    removeExplosion( explosion ){
        const index = this.explosions.indexOf( explosion );
        if (index != -1) this.explosions.indexOf(index, 1);
    }

    reset(){
        this.obstacleSpawn = { pos: 20, offset: 5 };
        this.obstacles.forEach( obstacle => this.respawnObstacle(obstacle) );
        let count;
        while( this.explosions.length>0 && count<100){
            this.explosions[0].onComplete();
            count++;
        }
    }

    respawnObstacle( obstacle ){
        this.obstacleSpawn.pos += 30;
        const offset = (Math.random()*2 - 1) * this.obstacleSpawn.offset;
        this.obstacleSpawn.offset += 0.2;
        obstacle.position.set(0, offset, this.obstacleSpawn.pos );
        obstacle.children[0].rotation.y = Math.random() * Math.PI * 2;
		obstacle.userData.hit = false;
		obstacle.children.forEach( child => {
			child.visible = true;
		});
    }

	update(pos, time){
        let collisionObstacle;

        this.obstacles.forEach( obstacle =>{
            obstacle.children[0].rotateY(0.01);
            const relativePosZ = obstacle.position.z-pos.z;
            if (Math.abs(relativePosZ)<2 && !obstacle.userData.hit){
                collisionObstacle = obstacle;
            }
            if (relativePosZ<-20){
                this.respawnObstacle(obstacle); 
            }
        });

       
        if (collisionObstacle!==undefined){
			collisionObstacle.children.some( child => {
				child.getWorldPosition(this.tmpPos);
				const dist = this.tmpPos.distanceToSquared(pos);
				if (dist<5){
					collisionObstacle.userData.hit = true;
					this.hit(child);
                    return true;
                }
            })
            
        }

        this.explosions.forEach( explosion => {
            explosion.update( time );
        });
    }

	hit(obj){
		if (obj.name=='candy'){
			obj.visible = false;
			this.game.incScore();
        }else{
            this.explosions.push( new Explosion(obj, this) );
			this.game.decLives();
        }
	}
}

export { Obstacles };