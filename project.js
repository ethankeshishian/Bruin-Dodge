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
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5,
                diffusivity: 0.1,
                specularity: 0.1,
                texture: new Texture("assets/stars.png"),
            }),
        };

        this.initial_camera_location = Mat4.look_at(
            vec3(0, 10, 20),
            vec3(0, 0, 0),
            vec3(0, 1, 0)
        );

        this.cubes = Array();
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
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

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [
            new Light(light_position, color(1, 1, 1, 1), 1000),
        ];

        let t = program_state.animation_time / 1000,
            dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        // Generating cubes
        let z = -30;
        let l = z * (1 / (context.width / context.height));
        let r = -l;

        const generateCube = () => {
            let randX = Math.floor(Math.random() * (r - l) + l);
            this.cubes.push({
                x: randX,
                // z: playerZ,
            });
            this.cubes.map((cube) =>
                this.shapes.box_1.draw(
                    context,
                    program_state,
                    model_transform.times(Mat4.translation(cube.x, 0, z)),
                    this.materials.phong.override({
                        color: hex_color("ffff00"),
                    })
                )
            );
        };

        generateCube();
        // setInterval(generateCube, 1000);
        // this.shapes.box_1.draw(context, program_state, model_transform.times(Mat4.translation(r, 0, z)), this.materials.phong.override({color: hex_color("ffff00")}));

        let person_transform = model_transform
            .times(Mat4.translation(0, -3, 0))
            .times(Mat4.scale(0.5, 0.5, 0.5));
        person_transform = person_transform.times(Mat4.translation(0, 0, -t));
        this.shapes.person.draw(
            context,
            program_state,
            person_transform,
            this.materials.phong.override({ color: hex_color("#e3d8d8") })
        );

        let desired = Mat4.inverse(
            person_transform.times(Mat4.translation(0, 0, 5))
        );
        program_state.set_camera(desired);
    }
}

class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return (
            this.shared_glsl_code() +
            `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D( texture, f_tex_coord);
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `
        );
    }
}

class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return (
            this.shared_glsl_code() +
            `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                vec4 tex_color = texture2D( texture, f_tex_coord );
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `
        );
    }
}
