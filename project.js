import { defs, tiny } from "./examples/common.js";

const {
    Vector,
    Vector3,
    vec,
    vec3,
    vec4,
    color,
    hex_color,
    Shader,
    Matrix,
    Mat4,
    Light,
    Shape,
    Material,
    Scene,
    Texture,
} = tiny;

const { Sphere, Cube, Axis_Arrows, Textured_Phong } = defs;

export class Project extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.person_transform = Mat4.identity();
        this.control_movement = Mat4.identity();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            person: new defs.Subdivision_Sphere(4),
            cube: new Cube(),
        };

        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            ground: new Material(new Texture_Scale(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/road.png", "NEAREST")
            }),
            daddygene: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/gene.jpg", "NEAREST")
            }),
            asish: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/asish.jpg", "NEAREST")
            }),
            legs: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/legs.png", "NEAREST")
            }),
        };

        this.initial_camera_location = Mat4.look_at(
            vec3(0, 10, 20),
            vec3(0, 0, 0),
            vec3(0, 1, 0)
        );

        this.cubes = Array();

        // this.left = Mat4.translation(-2,0,0);
        // this.right = Mat4.translation(2, 0, 0);
        this.roll = 0;
        this.move = 0;

        this.distanceTravelled = 0;
    }

    make_control_panel() {
        // implement movements to left and right
        this.key_triggered_button("Dodge to left", ["ArrowLeft"],
            () => {
            // this.control_movement = this.control_movement.times(this.left);
            this.roll = 1;
            this.move = -0.5;
        },
            undefined, () => { this.roll = 0; this.move = 0; });
        this.key_triggered_button("Dodge to right", ["ArrowRight"],
            () => {
            // this.control_movement = this.control_movement.times(this.right);
            this.roll = -1;
            this.move = 0.5;
        },
             undefined, () => { this.roll = 0; this.move = 0; });
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(
                (context.scratchpad.controls = new defs.Movement_Controls())
            );
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4,
            context.width / context.height,
            1,
            100
        );

        // Important variables
        let t = program_state.animation_time / 1000,
            dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        let speed_scaling_factor = .05; let base_speed = .25;
        let max_speedup = .75;
        let speed = base_speed + Math.min(max_speedup, Math.max(t * speed_scaling_factor));

        let distanceFromPlayer = 10;
        const playerRadius = 1;
        const cubeRadius = 1;

        let z = -100;
        let screen_width = -z;
        // let aspect_ratio = (context.width / context.height);
        let l = -screen_width + this.control_movement[0][3];
        let r = screen_width + this.control_movement[0][3];

        // Creating lighting
        const light_position = vec4(this.control_movement[0][3], 10, -(this.distanceTravelled), 1);
        program_state.lights = [
            new Light(light_position, color(1, 1, 1, 1), 1000),
        ];

        // Creating cubes
        const generateCube = () => {
            let randX = Math.floor(Math.random() * (r - l) + l);
            this.cubes.push({
                x: randX,
                z: (-this.distanceTravelled + z),
                color: color(Math.random(), Math.random(), Math.random(), 1.0)
            });
            for (let i = 0; i < this.cubes.length; i++){
                let cube = this.cubes[i];

                // Remove cubes behind player
                ((-cube.z + distanceFromPlayer) < this.distanceTravelled) ? this.cubes.splice(i, 1) :
                    (this.shapes.cube.draw(
                        context,
                        program_state,
                        model_transform.times(Mat4.translation(cube.x, 0, cube.z)),
                        this.materials.legs
                    ),
                    this.shapes.cube.draw(
                        context,
                        program_state,
                        model_transform.times(Mat4.translation(cube.x, 2, cube.z)),
                        this.materials.phong
                             .override({
                             color: cube.color,
                        })
                    ),
                    this.shapes.person.draw(
                        context,
                        program_state,
                        model_transform.times(Mat4.translation(cube.x, 4, cube.z)).times(Mat4.rotation(Math.PI / 0.75, 0.2, 1, 0.45)),
                        // this.materials.phong.override({ color: hex_color("#e3d8d8") })
                        this.materials.daddygene
                    )
                    );

                // Collision detection
                if ((((this.distanceTravelled + playerRadius) < (-cube.z + cubeRadius) && (this.distanceTravelled + playerRadius) > (-cube.z - cubeRadius)) ||
                    ((this.distanceTravelled - playerRadius) < (-cube.z + cubeRadius) && (this.distanceTravelled - playerRadius) > (-cube.z - cubeRadius))) &&
                    ((this.control_movement[0][3] + playerRadius) < (cube.x + cubeRadius) && ((this.control_movement[0][3] + playerRadius) > (cube.x - cubeRadius)) ||
                    ((this.control_movement[0][3] - playerRadius) < (cube.x + cubeRadius) && ((this.control_movement[0][3] - playerRadius) > (cube.x - cubeRadius)))) ||
                    (this.distanceTravelled < (-cube.z + cubeRadius) && this.distanceTravelled > (-cube.z - cubeRadius) && this.control_movement[0][3] < (cube.x + cubeRadius) && (this.control_movement[0][3] > (cube.x - cubeRadius)))){
                    this.materials.phong.override({
                        color: hex_color("ffff00"),
                    })
                    if(!alert('You lost! Your score was ' + this.distanceTravelled.toFixed(2) + '. Press ok to start new game.')){window.location.reload();}
                }
            }
        };

        generateCube();

        // Draw floor
        let size = -z;
        this.shapes.cube.draw(
            context,
            program_state,
            model_transform.times(Mat4.scale(size * size, 1, size * size)).times(Mat4.translation(0, -cubeRadius * 2, -this.distanceTravelled/(size * size))),
            this.materials.ground
        );

        // Creating player

        if (this.move !== 0)
            this.control_movement = this.control_movement.times(Mat4.translation(this.move * speed, 0, 0));

        this.person_transform = model_transform
            .times(Mat4.translation(0, 0, -this.distanceTravelled)).times(this.control_movement);
        this.distanceTravelled += speed;

        this.person_transform.post_multiply(Mat4.rotation(.1 * this.roll, 0, 0, 1));

        this.shapes.person.draw(
            context,
            program_state,
            this.person_transform.times(Mat4.rotation(Math.PI / 0.70, 0, 1, -0.2)),
            // this.materials.phong.override({ color: hex_color("#e3d8d8") })
            this.materials.asish
        );

        // attach camera to player, including on moves to left or right
        let desired = Mat4.inverse(
            this.person_transform.times(Mat4.translation(0, 5, distanceFromPlayer))
        )
        let blending_factor = 0.1;
        let mixed = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, blending_factor))
        program_state.set_camera(mixed);
    }
}

class Texture_Scale extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                vec2 translated_tex_coord = vec2(f_tex_coord.x * 2000.0, f_tex_coord.y * 2000.0 - animation_time * 3.0);
                vec4 tex_color = texture2D( texture, translated_tex_coord);
               
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}