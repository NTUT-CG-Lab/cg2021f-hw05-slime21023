import { GUI } from './jsm/jsm/libs/dat.gui.module.js'
import { OrbitControls } from './jsm/jsm/controls/OrbitControls.js'
import { OutlineEffect } from './jsm/jsm/effects/OutlineEffect.js'
import { MMDLoader } from './jsm/jsm/loaders/MMDLoader.js'
import { MMDAnimationHelper } from './jsm/jsm/animation/MMDAnimationHelper.js'
import { AnimationMixer, Int8Attribute } from './build/three.module.js'
import {
    OrthographicCamera,
    Scene,
    Color,
    AmbientLight,
    DirectionalLight,
    WebGLRenderer
} from './build/three.module.js'


Ammo().then(async AmmoLib => {
    Ammo = AmmoLib
    const data = await load()
    // console.log(data)
    const animate = init(data)
    animate()
})

const load = async () => {
    const onProgress = xhr => {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100
            console.log(`${Math.round(percentComplete, 2)}% downloaded`)
        }
    }

    const loadModel = item => new Promise(resolve => {
        const { location } = item
        const loader = new MMDLoader()
        loader.load(location, model => {
            model.position.y = -10
            resolve({ model, ...item })
        }, onProgress, null)
    })

    const response = await fetch('model_data.json')
    const data = await response.json()
    const { modellist } = data
    return await Promise.all(modellist.map(loadModel))
}

const initGui = (mesh, data) => {
    const standardlist = {
        eyebrow_troubled_left: 0, eyebrow_troubled_right: 0, eyebrow_angry_left: 0, eyebrow_angry_right: 0, eyebrow_serious_left: 0, eyebrow_serious_right: 0
        , eyebrow_happy_left: 0, eyebrow_happy_right: 0, eyebrow_lowered_left: 0, eyebrow_lowered_right: 0, eyebrow_raised_left: 0, eyebrow_raised_right: 0, eye_wink_left: 0, eye_wink_right: 0
        , eye_happy_wink_left: 0, eye_happy_wink_right: 0, eye_relaxed_left: 0, eye_relaxed_right: 0, eye_unimpressed_left: 0, eye_unimpressed_right: 0, eye_raised_lower_eyelid_left: 0,
        eye_raised_lower_eyelid_right: 0, eye_surprised_left: 0, eye_surprised_right: 0, iris_small_left: 0, iris_small_right: 0, mouth_aaa: 0, mouth_iii: 0, mouth_uuu: 0, mouth_eee: 0, mouth_ooo: 0
        , mouth_delta: 0, mouth_smirk: 0, mouth_raised_corner_left: 0, mouth_raised_corner_right: 0, mouth_lowered_corner_left: 0, mouth_lowered_corner_right: 0, iris_rotation_x: 0, iris_rotation_y: 0, head_x: 0, head_y: 0, head_z: 0
    }

    const gui = new GUI()
    const controls = {}
    const morphs = gui.addFolder('Morphs')
    const keys = Object.keys(standardlist)
    for (const key in standardlist) { controls[key] = 0.0 }

    const onChangeMorph = () => {
        keys.forEach(key => {
            const index = data[key]
            mesh.morphTargetInfluences[index] = controls[key]
        })
    }

    keys.forEach(key => {
        morphs.add(controls, key, 0.0, 1.0, 0.01).onChange(onChangeMorph)
    })
    onChangeMorph()
    morphs.open()
    const destroy = () => { gui.destroy() }
    return destroy
}

const init = models => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const SCREEN_WIDTH = window.innerWidth
    const SCREEN_HEIGHT = window.innerHeight
    const frustumSize = 30
    const aspect = SCREEN_WIDTH / SCREEN_HEIGHT

    const camera = new OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
    )
    camera.position.z = 25

    //scene
    const scene = new Scene()
    scene.background = new Color(0xffffff)

    const ambient = new AmbientLight(0x666666)
    scene.add(ambient)

    const directionalLight = new DirectionalLight(0x887766)
    directionalLight.position.set(-1, 1, 1).normalize()
    scene.add(directionalLight)

    const renderer = new WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
    container.appendChild(renderer.domElement)

    const effect = new OutlineEffect(renderer)
    const onWindowResize = () => {
        effect.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
        camera.left = frustumSize * aspect / -2
        camera.right = frustumSize * aspect / 2
        camera.top = frustumSize / 2
        camera.bottom = - frustumSize / 2
        camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onWindowResize)

    const cameraCtrls = new OrbitControls(camera, renderer.domElement)
    cameraCtrls.minDistance = 10
    cameraCtrls.maxDistance = 100
    cameraCtrls.enableRotate = false

    const len = models.length
    let mesh, des
    let modelIndex = 0
    const setModel = index => {
        if (mesh) scene.remove(mesh)
        if (des) des()

        const { model, ...data } = models[index]
        mesh = model
        scene.add(mesh)
        des = initGui(mesh, data)
    }

    setModel(modelIndex)
    window.addEventListener('keydown', ({ key }) => {
        if (key != 'a' && key != 'A') return
        setModel(Math.abs(--modelIndex) % len)
    })

    window.addEventListener('keydown', ({ key }) => {
        if (key != 'd' && key != 'D') return
        setModel(Math.abs(++modelIndex) % len)
    })

    const animate = () => {
        requestAnimationFrame(animate)
        effect.render(scene, camera)
    }
    return animate
}