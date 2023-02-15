(function() {
    let export_action_zer;
    let Cbones = {
        head_c:0,
        left_leg_c:0,
        right_leg_c:0,
        left_arm_c:0,
        right_arm_c:0
    };

    Plugin.register('CPManim', {
        title: 'CPM animation exporter',
        icon: 'star',
        author: 'zerustu',
        description: 'convert blockbench animation to js files for 1.16 CPM',
        version: '1.2.0',
        variant: 'both',

        onload() {
            let codecanim = new Codec('CPM_animation', {
                name: 'CPM animation',
                fileName() {return 'animation.js';},
                extension: 'js',
				remember: false,
				compile() {
                    let result = "";
                    let animationcode = "";
                    let bones = [];
                    let allbones = Project.groups;
                    let conditions = {
                        "walk": "is_walking && !entity.isSprinting() && Pose == \"standing\" && !entity.isHurt() && !entity.isRiding() && !entity.isInWater()",
                        "run": "entity.isSprinting() && Pose == \"standing\" && !entity.isHurt() && !entity.isRiding()",
                        "climbing": "Pose == \"swimming\" && !entity.isInWater() && !entity.isHurt()",
                        "sneaking": "Pose == \"crouching\" && !is_walking && !entity.isHurt()",
                        "sneak": "Pose == \"crouching\" && is_walking && !entity.isHurt()",
                        "swim": "entity.isInWater() && entity.isSprinting()",
                        "swim_stand": "entity.isInWater() && !entity.isSprinting()",
                        "attacked": "entity.isHurt()",
                        "jump": "Pose == \"standing\" && !entity.isOnGround() && !entity.isHurt() && !entity.isRiding() && !entity.isInWater()",
                        "fly": "Pose == \"elytra_flying\" && !entity.isHurt()",
                        "boat": "entity.isRiding() && !entity.isHurt()",
                        "use_righthand": "entity.getSwingProgress()",
                        "use_lefthand": "false",
                        "sleep": "Pose == \"sleeping\" && !entity.isHurt()",
                        "ride": "entity.isRiding() && !entity.isHurt()",
                        "ride_pig": "entity.isRiding() && !entity.isHurt()",
                        "sit": "entity.isRiding() && !entity.isHurt()",
                        "idle": "!is_walking && Pose == \"standing\" && !entity.isHurt() && !entity.isRiding() && entity.isOnGround() && !entity.isInWater()",
                    };
                    let sitstates = ["boat", "ride", "sit", "ride_pig"];
                    var didsit = false;
                    let states = Object.keys(conditions);

                    //console.log(states);

                    function ParseAnimation(animation)
                    {
                        let lines = "        if(last_anim != \"" + animation.name + "\") {\n            timer_" + animation.name + " = entity.getAge() + entity.getPartial();\n            last_anim = \"" + animation.name + "\";\n        };\n";
                        for (var animatorId in animation.animators) {
                            var animator = animation.animators[animatorId];
                            var realbone = allbones.find(object => object.name == animator.name);
                            var parent = realbone.parent;
                            var position =[...realbone.origin];
                            if (parent != "root")
                            {
                                for (let index = 0; index < 3; index++) {
                                    position[index] -= parent.origin[index];
                                    
                                }
                            }
                            else //if (!Object.keys(Cbones).includes(realbone.name))
                            {
                                position[1] -= 24;
                            }
                            position[0] *= -1;
                            var rotation = [...realbone.rotation];
                            rotation[0] *= -1;
                            rotation[1] *= -1;
                            //var temp = rotation[1];
                            //rotation[1] = rotation[2];
                            //rotation[2] = -temp;
                            if (animator.position.length > 0) {
                                if (!bones.includes(animator.name)) {bones.push(animator.name);};
                                lines += "        " + animator.name + "_pos = animate(anim_time - timer_" + animation.name + ", partial,[";
                                animator.position.forEach(keyframe => {
                                    lines += keyframe.getTimecodeString() + ','
                                    let points = keyframe.getArray();
                                    for (let index = 0; index < 3; index++) {
                                        lines += (points[index] + position[index]) + ",";
                                        
                                    }
                                });
                                lines += "-1]," + animation.length + ");\n";
                            }
                            if (animator.rotation.length > 0) {
                                if (!bones.includes(animator.name)) {bones.push(animator.name);};
                                lines += "        " + animator.name + "_rot = animate(anim_time - timer_" + animation.name + ", partial,[";
                                animator.rotation.forEach(keyframe => {
                                    lines += keyframe.getTimecodeString() + ','
                                    let points = keyframe.getArray();
                                    for (let index = 0; index < 3; index++) {
                                        lines +=  (points[index] + rotation[index]) + ",";
                                        
                                    }
                                })
                                lines += "-1]," + animation.length + ");\n";
                            }
                        }
                        return lines;
                    }
                    
                    Project.animations.forEach(anim => {
                        //console.log("now looking at " + anim.name + " (" + states.includes(anim.name) + ")");
                        if (states.includes(anim.name)) {
                            if (!(sitstates.includes(anim.name) && didsit)) {
                                animationcode += "    if(" + conditions[anim.name] + ") {  // " + anim.name + " \n";
                                animationcode += ParseAnimation(anim) + "                animated = true;\n    }\n";
                            }
                            if (sitstates.includes(anim.name)) {didsit = true;};
                        }
                        else {states.push(anim.name);};
                    });

                    var have_default = false;
                    var default_anim = Project.animations.find(anim => anim.name == "default");
                    if (default_anim != undefined) {
                        animationcode += "    if(!animated) {  // " + default_anim.name + " \n";
                        animationcode += ParseAnimation(default_anim) + "    }\n";
                        have_default = true;
                    }

                    for (var c_bone in Cbones) {
                        if (Cbones[c_bone]) {
                            if (!bones.includes(c_bone)) {bones.push(c_bone);};
                        }
                    }

                    // declare all the variables
                    result = "var ";
                    bones.forEach(bone => {
                        result += "pointer_" + bone + ", " + bone + "_pos, " + bone + "_rot, ";
                    });
                    states.forEach(state => {
                        result += "timer_" + state + ", ";
                    });
                    if (have_default) {result += "timer_default, "}
                    
                    for (var c_bone in Cbones) {
                        if (Cbones[c_bone]) {
                            result += c_bone + ", ";
                        }
                    }

                    result += "walkingtest, Pose, is_walking, last_anim, anim_time, partial, animated;\n\n" + 

                    // animate funtion
                    "function animate(tick, partial, frames, length) {\n    if(length ==0) {\n        return [frames[1], frames[2], frames[3]];\n    }\n    var last = Math.floor(frames.length/4);\n    var time = (tick/20) % length + partial/20.;\n    for(var i = 1; i < last; i++) {\n        if (time >= frames[4*(i-1)] & time < frames[4*i]) {\n            var t = (time - frames[4*(i-1)]) / (frames[4*i] - frames[4*(i-1)]);\n            return [t*(frames[4*i+1] - frames[4*(i-1)+1]) + frames[4*(i-1)+1], t*(frames[4*i+2] - frames[4*(i-1)+2]) + frames[4*(i-1)+2], t*(frames[4*i+3] - frames[4*(i-1)+3]) + frames[4*(i-1)+3]];\n        }\n    }\n    return [frames[4*last-3],frames[4*last-2],frames[4*last-1]];\n}" + 

                    //init
                    " \n\nfunction init(entity, model)  { \n";

                    //get every pointer of bones
                    bones.forEach(bone => {
                        result += "    pointer_" + bone + " = model.getBone(\"" + bone + "\");\n";
                    });

                    //get pointer of vanilla bones
                    for (var c_bone in Cbones) {
                        if (Cbones[c_bone]) {
                            result += "    " + c_bone + " = model.getBone(\"" + c_bone.substring(0, c_bone.length - 2) + "\");\n";
                        }
                    }
                    //console.log(Cbones);

                    //set some variable
                    result += "    walkingtest = entity.getLimbSwing(); \n    is_walking = false; \n    Pose = \"\"; \n    last_anim = \"\"\n    anim_time = 0;\n    partial = 0.;\n    animated = false;\n}\n\nfunction update(entity, model) {\n    Pose = entity.getPose();    anim_time = entity.getAge();\n    partial = entity.getPartial();\n    animated = false;\n";
                    
                    //update function
                    bones.forEach(bone => {
                        var realbone = allbones.find(object => object.name == bone);
                        var parent = realbone.parent;
                        var position =[...realbone.origin];
                        if (parent != "root")
                        {
                            for (let index = 0; index < 3; index++) {
                                position[index] -= parent.origin[index]; 
                            }
                        }
                        else //if (!Object.keys(Cbones).includes(realbone.name))
                        {
                            position[1] -= 24;
                        }
                        position[0] *= -1;
                        var rotation =[...realbone.rotation];
                        rotation[0] *= -1;
                        rotation[1] *= -1;
                        //var temp = rotation[1];
                        //rotation[1] = rotation[2];
                        //rotation[2] = -temp;
                        //set the default value for everybone
                        result += "    " + bone + "_pos = [" + position + "]; \n    " + bone + "_rot = [" + rotation + "]; \n";
                    });

                    //add all the animation
                    result += animationcode;

                    //applie the animation
                    //console.log(Cbones);
                    bones.forEach(bone => {
                        //console.log("doing : " + bone);
                        if (Object.keys(Cbones).includes(bone) && Cbones[bone]) {
                            if (bone == "head_c") {
                                result += "    pointer_" + bone + ".setPosition(" + bone + "_pos[0]," + bone + "_pos[1]," + bone + "_pos[2]);\n    pointer_" + bone + ".setRotation(" + bone + "_rot[0] + " + ((Cbones[bone] == 1) ? "" : "(-1)*") + " entity.getHeadPitch(), " + bone + "_rot[1] + " + ((Cbones[bone] == 1) ? "" : "(-1)*") + "entity.getHeadYaw(), "  + bone + "_rot[2]);\n";
                            }
                            else {
                                result += "    pointer_" + bone + ".setPosition(" + bone + "_pos[0]," + bone + "_pos[1]," + bone + "_pos[2]);\n    pointer_" + bone + ".setRotation(" + bone + "_rot[0] + " + ((Cbones[bone] == 1) ? "" : "(-1)*") + bone + ".getRotationX(), " + bone + "_rot[1] + " + ((Cbones[bone] == 1) ? "" : "(-1)*") + bone + ".getRotationY(), " + bone + "_rot[2] + " + ((Cbones[bone] == 1) ? "" : "(-1)*") + bone + ".getRotationZ());\n";
                            }
                        }
                        else {
                            result += "    pointer_" + bone + ".setPosition(" + bone + "_pos[0]," + bone + "_pos[1]," + bone + "_pos[2]);\n    pointer_" + bone + ".setRotation(" + bone + "_rot[0]," + bone + "_rot[1]," + bone + "_rot[2]);\n";
                        }
                    });



                    result += "}\n\nfunction tick(entity, model) {\n    is_walking = (entity.getLimbSwing() - walkingtest)>0.2 &!( entity.isRiding()) &!(entity.getPose() == \"swimming\") & entity.isOnGround();\n    walkingtest = entity.getLimbSwing();\n}"
                    return result;
                },
				parse(model, path) {

				}
            });
            
            export_action_zer = new Action('export_cpm_anim_zeru', {
				name: 'Export CPM animation',
				description: '',
				icon: 'star',
				category: 'file',
				click() {

                    for (var bonename in Cbones) {
                        Cbones[bonename] = 0;
                        let a_c_bone = Project.groups.find(elem => elem.name == bonename);
                        if (a_c_bone != undefined) {
                            let parent = a_c_bone.parent;
                            Cbones[bonename] = (parent == "root") ? -1 : 1;
                        }
                    };
                    let dialog = new Dialog({
                    title: "CPM Model Export",
                    id: "cpm_export",
                    draggable: true,
                    form: {
                        head_c_text: {label: "head_c", type: 'info', text: Cbones["head_c"] ? (Cbones["head_c"] == 1 ? "the bone is not a root bone, do you want to add the animation?" : "ok") : "no head_c bone found"},
                        head_c: Cbones["head_c"] == 1 ? {label: "add head rotation", type: 'checkbox', value: false} : "_",
                        left_leg_c_text: {label: "left_leg_c", type: 'info', text: Cbones["left_leg_c"] ? (Cbones["left_leg_c"] == 1 ? "the bone is not a root bone, do you want to add the animation?" : "ok") : "no left_leg_c bone found"},
                        left_leg_c: Cbones["left_leg_c"] == 1 ? {label: "add default animation", type: 'checkbox', value: false} : "_",
                        right_leg_c_text: {label: "right_leg_c", type: 'info', text: Cbones["right_leg_c"] ? (Cbones["right_leg_c"] == 1 ? "the bone is not a root bone, do you want to add the animation?" : "ok") : "no right_leg_c bone found"},
                        right_leg_c: Cbones["right_leg_c"] == 1 ? {label: "add default animation", type: 'checkbox', value: false} : "_",
                        left_arm_c_text: {label: "left_arm_c", type: 'info', text: Cbones["left_arm_c"] ? (Cbones["left_arm_c"] == 1 ? "the bone is not a root bone, do you want to add the animation?" : "ok") : "no left_arm_c bone found"},
                        left_arm_c: Cbones["left_arm_c"] ==1 ? {label: "add default animation", type: 'checkbox', value: false} : "_",
                        right_arm_c_text: {label: "right_arm_c", type: 'info', text: Cbones["right_arm_c"] ? (Cbones["right_arm_c"] == 1 ? "the bone is not a root bone, do you want to add the animation?" : "ok") : "no right_arm_c bone found"},
                        right_arm_c: Cbones["right_arm_c"] == 1 ? {label: "add default animation", type: 'checkbox', value: false} : "_"
                    },
                    onConfirm: function(formData) {
                        this.hide();
                        for (var c_bone in Cbones) {
                            Cbones[c_bone] *= formData[c_bone];
                            if (isNaN(Cbones[c_bone])) {Cbones[c_bone] = 0;};
                        }

                        //console.log(Cbones);
                        codecanim.export();
                    }
                });
                dialog.show();
            }
			});
			MenuBar.addAction(export_action_zer, 'file.export');
		},

		onunload() {
			export_action_zer.delete();
		}
    });
})();