import {JSONLoader} from "../resources/JSONLoader"
import {ImageLoader} from "../resources/ImageLoader"
import {TextureAtlas} from "../sprites/TextureAtlas"
import {Sprite} from "../sprites/Sprite"
import {StaticSprite} from "../sprites/StaticSprite"
import {AnimatedSprite} from "../sprites/AnimatedSprite"
import {InteractableSprite} from "../sprites/InteractableSprite"
import {SpriteAnimation} from "../sprites/SpriteAnimation"
import {NavMesh} from "../collision/NavMesh"
import {Triangle} from "../collision/Triangle"
import {Interaction}  from "./Interaction"
import {ReceiveItemInteraction} from "./ReceiveItemInteraction"
import {Item} from "../items/Item"
import {Circle} from "../collision/Circle"
import {Rectangle} from "../collision/Rectangle"

export class Level
{
    static loadLevel(path: string, items: any): Promise<any>
    {
        return new Promise<any>((resolve, reject) => {
            const levelDataPromise = JSONLoader.loadJSONFile(path).then((levelData) => {
                // create the texture atlas
                let atlas = new TextureAtlas(levelData.texture_atlas);
                const textureAtlasPromise = atlas.load().catch(() => {
                    console.log("error: texture atlas could not be loaded");
                });

                // create the sprites
                let staticSprites = new Array<StaticSprite>();
                let interactableSprites = new Array<InteractableSprite>();
                for(const obj of levelData.static_sprites)
                {
                    if(obj.type == "interactable") {
                        let interactions = new Array<Interaction>();
                        for(const inter of obj.interactions)    // create an array of interactions
                        {
                            if(inter.type == "receive_item") {
                                let receiveItems = new Array<Item>();
                                for(const itm of inter.items_received)   // create an array of receive items
                                {
                                    receiveItems.push(items[itm]);
                                }
                                interactions.push(new ReceiveItemInteraction(inter.item ? items[inter.item] : null, inter.success_text, inter.fail_text, receiveItems))
                            }
                        }
                        interactableSprites.push(new InteractableSprite(obj.x, obj.y, obj.scale, obj.origin_horizontal, obj.origin_vertical, atlas, obj.image_name, obj.examine_text,
                                            new Circle(obj.x, obj.y, obj.interaction_radius), new Rectangle(obj.x-obj.click_zone_width/2, obj.y-obj.click_zone_height/2, obj.click_zone_width, obj.click_zone_height), interactions));
                    } else {
                        staticSprites.push(new StaticSprite(obj.x, obj.y, obj.scale, obj.origin_horizontal, obj.origin_vertical, atlas, obj.image_name));
                    }
                }
                //let animatedSprites = new Array<AnimatedSprite>();

                // create the navmesh
                let tris = [];
                for(let tri of levelData.navmesh) {
                    tris.push(new Triangle(tri.x1, tri.y1, tri.x2, tri.y2, tri.x3, tri.y3));
                }
                let navmesh = new NavMesh(tris);

                Promise.all([textureAtlasPromise]).then(() => {
                    for(const sprite of staticSprites) {
                        sprite.refreshImage();  // texture atlas probably hadn't loaded when sprite was initialised so refresh image
                    }

                    for(const sprite of interactableSprites) {
                        sprite.refreshImage();  // texture atlas probably hadn't loaded when sprite was initialised so refresh image
                    }

                    resolve({'textureAtlas': atlas, 'sceneScale': levelData.scene_scale,
                            'playerStartX': levelData.player_start_x, 'playerStartY': levelData.player_start_y, 'playerStarts': levelData.player_starts,
                            'depthScaleY': levelData.depth_scale_y, 'navmesh': navmesh, 'staticSprites': staticSprites,
                            'interactableSprites': interactableSprites});
                }).catch(() => {
                    reject(null);
                });
            }).catch(() => {
                console.log("error: failed to load level");
                reject(null);
            });
        });
    }

    private constructor() {}
}
