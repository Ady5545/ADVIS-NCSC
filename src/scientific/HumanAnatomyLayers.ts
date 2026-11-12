import { ScientificComponent } from './ScientificSchema';

type V3 = [number, number, number];
type AnatomyPart = {
  shape: 'ellipsoid' | 'capsule' | 'bone' | 'joint' | 'rib' | 'box' | 'muscle';
  position: V3;
  rotation?: V3;
  scale?: V3;
  radius?: number;
  length?: number;
  headRadius?: number;
  points?: V3[];
};

const v = (x: number, y: number, z: number): V3 => [x, y, z];
const part = (
  shape: AnatomyPart['shape'],
  position: V3,
  dimensions: Partial<Pick<AnatomyPart, 'scale' | 'radius' | 'length' | 'headRadius' | 'points'>> = {},
  rotation: V3 = [0, 0, 0],
): AnatomyPart => ({ shape, position, rotation, ...dimensions });

const ellipsoid = (position: V3, scale: V3, rotation: V3 = [0, 0, 0]) =>
  part('ellipsoid', position, { scale }, rotation);
const capsule = (position: V3, radius: number, length: number, rotation: V3 = [0, 0, 0]) =>
  part('capsule', position, { radius, length }, rotation);
const bone = (position: V3, length: number, radius: number, headRadius = radius * 1.8, rotation: V3 = [0, 0, 0]) =>
  part('bone', position, { length, radius, headRadius }, rotation);
const joint = (position: V3, radius = 0.045) => part('joint', position, { radius });
const muscle = (position: V3, radius: number, length: number, rotation: V3 = [0, 0, 0]) =>
  part('muscle', position, { radius, length }, rotation);
const rib = (points: V3[], radius = 0.012) => part('rib', [0, 0, 0], { points, radius });

function anatomyComponent(
  id: string,
  name: string,
  scientificName: string,
  category: string,
  subsystemId: string,
  color: string,
  definition: string,
  fn: string,
  parts: AnatomyPart[],
  specifications: Record<string, string> = {},
): ScientificComponent {
  return {
    id,
    name,
    scientificName,
    category,
    subsystemId,
    parentId: null,
    childrenIds: [],
    geometry: {
      type: 'anatomical_shape',
      params: { parts },
      material: { color, metalness: 0.02, roughness: 0.56 },
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      explodedOffset: [0, 0, 0],
    },
    education: {
      name,
      scientificName,
      definition,
      function: fn,
      importance: 'Part of the normal anatomical structure and function of the human body.',
      curriculumLevel: 'HIGH_SCHOOL',
    },
    scientificProperties: Object.fromEntries(
      Object.entries(specifications).map(([key, value]) => [key, { value, description: 'Educational anatomical reference.' }]),
    ),
  };
}

const BODY = '#c58f75';
const BODY_SHADE = '#b77f68';
const MUSCLE = '#a9444d';
const MUSCLE_LIGHT = '#c85b61';
const BONE = '#e8dfca';
const BONE_SHADE = '#d7cdb8';
const CARTILAGE = '#78b8bd';

const body: ScientificComponent[] = [
  anatomyComponent('body_head', 'Head & Face', 'Caput', 'External body region', 'external_body', BODY,
    'The head contains the brain and the main sensory structures. The face provides the openings and muscles used for vision, breathing, eating, and expression.',
    'Houses the brain and special sense organs; facial muscles move the eyelids, lips, and cheeks.',
    [ellipsoid(v(0, 1.82, 0), v(0.145, 0.19, 0.145)), ellipsoid(v(0, 1.78, 0.12), v(0.10, 0.105, 0.055)),
     ellipsoid(v(-0.145, 1.82, 0), v(0.028, 0.055, 0.035)), ellipsoid(v(0.145, 1.82, 0), v(0.028, 0.055, 0.035)),
     ellipsoid(v(0, 1.81, 0.17), v(0.022, 0.045, 0.028))],
    { 'Main regions': 'Cranium, face, jaw and sensory organs', 'Reference orientation': 'Anterior surface faces +Z' }),
  anatomyComponent('body_neck', 'Neck', 'Collum', 'External body region', 'external_body', BODY_SHADE,
    'The neck connects the head to the trunk and contains the cervical spine, airway, food passage, major vessels, and supporting muscles.',
    'Supports and moves the head while providing protected pathways between the head and thorax.',
    [capsule(v(0, 1.59, 0), 0.073, 0.16), ellipsoid(v(0, 1.59, 0.015), v(0.09, 0.11, 0.075))],
    { 'Vertebral region': 'C1–C7', 'Major movements': 'Flexion, extension, rotation and lateral flexion' }),
  anatomyComponent('body_chest', 'Chest / Thorax', 'Thorax', 'External body region', 'external_body', BODY,
    'The thorax is the upper trunk region enclosed by the rib cage. It contains the heart and lungs and is separated from the abdominal cavity by the diaphragm.',
    'Protects cardiopulmonary organs and changes volume during breathing.',
    [ellipsoid(v(0, 1.32, 0), v(0.245, 0.27, 0.145)), ellipsoid(v(0, 1.34, -0.08), v(0.22, 0.22, 0.10))],
    { 'Superior boundary': 'Thoracic inlet', 'Inferior boundary': 'Diaphragm', 'Protection': 'Heart and lungs' }),
  anatomyComponent('body_abdomen', 'Abdomen', 'Abdomen', 'External body region', 'external_body', BODY_SHADE,
    'The abdomen lies between the thorax and pelvis. Its muscular wall encloses much of the digestive system and helps support the trunk.',
    'Protects abdominal viscera, supports posture, and contributes to trunk movement and pressure regulation.',
    [ellipsoid(v(0, 1.04, 0.005), v(0.205, 0.235, 0.125))],
    { 'Superior boundary': 'Diaphragm', 'Inferior boundary': 'Pelvic inlet', 'Wall layers': 'Skin, fascia and abdominal muscles' }),
  anatomyComponent('body_pelvis_region', 'Pelvic Region', 'Regio Pelvica', 'External body region', 'external_body', BODY_SHADE,
    'The pelvic region forms the transition between the trunk and lower limbs and surrounds the pelvic cavity.',
    'Transfers upper-body load to the lower limbs and protects pelvic organs.',
    [ellipsoid(v(0, 0.80, 0), v(0.235, 0.16, 0.145))],
    { 'Framework': 'Two hip bones, sacrum and coccyx', 'Major role': 'Load transfer and organ protection' }),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_shoulder_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Shoulder`, 'Regio Deltoidea',
    'External body region', 'external_body', BODY,
    'The shoulder region links the upper limb to the trunk through the clavicle, scapula, shoulder joint and surrounding muscles.',
    'Positions the upper limb and permits a wide range of arm movement.',
    [ellipsoid(v(side * 0.245, 1.45, 0), v(0.12, 0.12, 0.12)), ellipsoid(v(side * 0.28, 1.40, 0.015), v(0.09, 0.12, 0.09))],
    { 'Key articulation': 'Glenohumeral joint', 'Girdle bones': 'Clavicle and scapula' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_upper_arm_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Upper Arm`, 'Brachium',
    'External body region', 'external_body', BODY,
    'The upper arm extends from the shoulder to the elbow and contains the humerus and major flexor and extensor muscles.',
    'Acts as a lever between the shoulder and elbow for positioning the hand.',
    [capsule(v(side * 0.335, 1.235, 0), 0.072, 0.22, [0, 0, side * 0.22])],
    { 'Proximal joint': 'Shoulder', 'Distal joint': 'Elbow', 'Main bone': 'Humerus' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_forearm_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Forearm`, 'Antebrachium',
    'External body region', 'external_body', BODY,
    'The forearm extends from the elbow to the wrist and contains the radius and ulna.',
    'Positions and rotates the hand; the radius crosses the ulna during pronation and supination.',
    [capsule(v(side * 0.405, 0.96, 0), 0.058, 0.22, [0, 0, side * 0.08])],
    { 'Bones': 'Radius and ulna', 'Main actions': 'Pronation, supination and wrist positioning' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_hand_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Hand`, 'Manus',
    'External body region', 'external_body', BODY,
    'The hand is made up of the wrist, palm and digits. Its many small bones and joints support grip and precise manipulation.',
    'Provides grasp, pinch and fine motor control.',
    [ellipsoid(v(side * 0.43, 0.79, 0.015), v(0.067, 0.095, 0.038)),
     capsule(v(side * 0.43, 0.70, 0.02), 0.014, 0.07, [0, 0, side * 0.12])],
    { 'Bone groups': 'Carpals, metacarpals and phalanges', 'Digits': 'Thumb plus four fingers' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_thigh_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Thigh`, 'Femoral Region',
    'External body region', 'external_body', BODY,
    'The thigh is the region between the hip and knee. It contains the femur and large muscle groups responsible for hip and knee movement.',
    'Supports body weight and produces powerful hip and knee movements.',
    [capsule(v(side * 0.145, 0.59, 0), 0.095, 0.30)],
    { 'Main bone': 'Femur', 'Major muscles': 'Quadriceps, hamstrings and adductors' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_knee_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Knee`, 'Regio Genus',
    'External body region', 'external_body', BODY_SHADE,
    'The knee region contains the knee joint and patella, connecting the thigh to the lower leg.',
    'Allows flexion and extension while helping stabilize the lower limb.',
    [ellipsoid(v(side * 0.15, 0.385, 0.015), v(0.087, 0.085, 0.095))],
    { 'Key bone': 'Patella', 'Main movement': 'Flexion and extension' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_lower_leg_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Lower Leg`, 'Crus',
    'External body region', 'external_body', BODY,
    'The lower leg extends from the knee to the ankle and contains the tibia and fibula.',
    'Transfers load from the knee to the ankle and helps control foot movement.',
    [capsule(v(side * 0.155, 0.215, 0), 0.068, 0.25)],
    { 'Bones': 'Tibia and fibula', 'Main role': 'Weight bearing and ankle control' },
  )),
  ...([-1, 1] as const).map((side) => anatomyComponent(
    `body_foot_${side < 0 ? 'left' : 'right'}`, `${side < 0 ? 'Left' : 'Right'} Foot`, 'Pes',
    'External body region', 'external_body', BODY,
    'The foot contains the tarsals, metatarsals and toe phalanges. Its arches distribute load and contribute to balance and propulsion.',
    'Supports standing, absorbs impact and provides push-off during walking.',
    [ellipsoid(v(side * 0.155, 0.055, 0.075), v(0.075, 0.055, 0.17)), ellipsoid(v(side * 0.155, 0.06, 0.19), v(0.07, 0.04, 0.07))],
    { 'Bone groups': 'Tarsals, metatarsals and phalanges', 'Key function': 'Support, balance and propulsion' },
  )),
];

const muscles: ScientificComponent[] = [
  ...([-1, 1] as const).flatMap((side) => {
    const label = side < 0 ? 'Left' : 'Right';
    const suffix = side < 0 ? 'left' : 'right';
    const s = side;
    return [
      anatomyComponent(`muscle_pectoralis_${suffix}`, `${label} Pectoralis Major`, 'Musculus Pectoralis Major', 'Chest muscle', 'muscular_system', MUSCLE_LIGHT,
        'A broad superficial chest muscle running from the clavicle and sternum toward the upper humerus.',
        'Adducts and medially rotates the arm; its clavicular portion also assists shoulder flexion.',
        [muscle(v(s * 0.12, 1.34, 0.135), 0.065, 0.20, [0, 0, s * 0.30])],
        { 'Region': 'Anterior thorax', 'Action': 'Arm adduction and medial rotation' }),
      anatomyComponent(`muscle_deltoid_${suffix}`, `${label} Deltoid`, 'Musculus Deltoideus', 'Shoulder muscle', 'muscular_system', MUSCLE,
        'A three-part triangular muscle covering the shoulder and arising from the clavicle and scapula.',
        'Abducts the arm; its anterior and posterior fibres assist flexion and extension.',
        [muscle(v(s * 0.255, 1.445, 0.055), 0.061, 0.14, [0, 0, s * 0.06])],
        { 'Region': 'Shoulder cap', 'Action': 'Arm abduction; assists flexion and extension' }),
      anatomyComponent(`muscle_biceps_${suffix}`, `${label} Biceps Brachii`, 'Musculus Biceps Brachii', 'Upper-arm muscle', 'muscular_system', MUSCLE_LIGHT,
        'A two-headed muscle on the anterior upper arm crossing the shoulder and elbow.',
        'Flexes the elbow and supinates the forearm; it also assists shoulder flexion.',
        [muscle(v(s * 0.34, 1.235, 0.073), 0.044, 0.22, [0, 0, s * 0.18])],
        { 'Heads': 'Long and short', 'Action': 'Elbow flexion and forearm supination' }),
      anatomyComponent(`muscle_triceps_${suffix}`, `${label} Triceps Brachii`, 'Musculus Triceps Brachii', 'Upper-arm muscle', 'muscular_system', MUSCLE,
        'A three-headed muscle on the posterior upper arm whose tendon attaches to the olecranon of the ulna.',
        'Extends the elbow; the long head also assists shoulder extension and adduction.',
        [muscle(v(s * 0.35, 1.22, -0.066), 0.045, 0.23, [0, 0, s * 0.16])],
        { 'Heads': 'Long, lateral and medial', 'Action': 'Elbow extension' }),
      anatomyComponent(`muscle_forearm_flexors_${suffix}`, `${label} Forearm Flexor Group`, 'Flexor Compartment of Antebrachium', 'Forearm muscle group', 'muscular_system', MUSCLE_LIGHT,
        'A group of anterior forearm muscles with tendons extending toward the wrist and fingers.',
        'Flexes the wrist and fingers and contributes to grip.',
        [muscle(v(s * 0.405, 0.955, 0.052), 0.037, 0.21, [0, 0, s * 0.07])],
        { 'Compartment': 'Anterior forearm', 'Action': 'Wrist and finger flexion' }),
      anatomyComponent(`muscle_forearm_extensors_${suffix}`, `${label} Forearm Extensor Group`, 'Extensor Compartment of Antebrachium', 'Forearm muscle group', 'muscular_system', MUSCLE,
        'A group of posterior forearm muscles whose tendons pass toward the back of the hand.',
        'Extends the wrist and fingers and helps stabilize the wrist during grip.',
        [muscle(v(s * 0.41, 0.95, -0.052), 0.035, 0.21, [0, 0, s * 0.07])],
        { 'Compartment': 'Posterior forearm', 'Action': 'Wrist and finger extension' }),
      anatomyComponent(`muscle_oblique_${suffix}`, `${label} External Oblique`, 'Musculus Obliquus Externus Abdominis', 'Abdominal muscle', 'muscular_system', MUSCLE,
        'A broad superficial muscle on the lateral abdominal wall with fibres running inferomedially.',
        'Compresses abdominal contents and assists trunk rotation and lateral flexion.',
        [muscle(v(s * 0.155, 1.035, 0.045), 0.043, 0.22, [0, 0, s * 0.42])],
        { 'Region': 'Lateral abdominal wall', 'Action': 'Trunk rotation and lateral flexion' }),
      anatomyComponent(`muscle_latissimus_${suffix}`, `${label} Latissimus Dorsi`, 'Musculus Latissimus Dorsi', 'Back muscle', 'muscular_system', MUSCLE,
        'A broad superficial back muscle extending from the lower back and trunk toward the humerus.',
        'Extends, adducts and medially rotates the arm; assists climbing and pulling.',
        [muscle(v(s * 0.16, 1.22, -0.12), 0.062, 0.31, [0, 0, s * 0.22])],
        { 'Region': 'Posterolateral trunk', 'Action': 'Arm extension, adduction and medial rotation' }),
      anatomyComponent(`muscle_erector_spinae_${suffix}`, `${label} Erector Spinae`, 'Musculi Erectores Spinae', 'Deep back muscle group', 'muscular_system', MUSCLE_LIGHT,
        'Long columns of deep back muscles running alongside the vertebral column.',
        'Extends the vertebral column and controls posture; unilateral contraction contributes to lateral flexion.',
        [muscle(v(s * 0.052, 1.25, -0.105), 0.028, 0.55)],
        { 'Columns': 'Iliocostalis, longissimus and spinalis', 'Action': 'Spinal extension and postural control' }),
      anatomyComponent(`muscle_gluteus_maximus_${suffix}`, `${label} Gluteus Maximus`, 'Musculus Gluteus Maximus', 'Hip muscle', 'muscular_system', MUSCLE,
        'A large superficial muscle forming much of the posterior buttock region.',
        'Powerfully extends and laterally rotates the hip, especially when rising or climbing.',
        [muscle(v(s * 0.125, 0.79, -0.10), 0.074, 0.17, [0, 0, s * 0.10])],
        { 'Region': 'Posterior hip', 'Action': 'Hip extension and lateral rotation' }),
      anatomyComponent(`muscle_quadriceps_${suffix}`, `${label} Quadriceps Femoris`, 'Musculus Quadriceps Femoris', 'Thigh muscle group', 'muscular_system', MUSCLE_LIGHT,
        'A four-muscle group occupying the anterior thigh and joining the patella through the quadriceps tendon.',
        'Extends the knee; the rectus femoris also assists hip flexion.',
        [muscle(v(s * 0.145, 0.59, 0.082), 0.067, 0.30)],
        { 'Muscles': 'Rectus femoris, vastus lateralis, medialis and intermedius', 'Action': 'Knee extension' }),
      anatomyComponent(`muscle_hamstrings_${suffix}`, `${label} Hamstrings`, 'Musculi Ischiocrurales', 'Thigh muscle group', 'muscular_system', MUSCLE,
        'A posterior thigh muscle group arising mainly from the ischial tuberosity and crossing the knee.',
        'Flexes the knee and extends the hip.',
        [muscle(v(s * 0.15, 0.59, -0.073), 0.059, 0.29)],
        { 'Muscles': 'Biceps femoris, semitendinosus and semimembranosus', 'Action': 'Knee flexion and hip extension' }),
      anatomyComponent(`muscle_adductors_${suffix}`, `${label} Adductor Group`, 'Musculi Adductores', 'Thigh muscle group', 'muscular_system', MUSCLE,
        'A group of muscles on the medial thigh linking the pubis and ischium to the femur.',
        'Adducts the thigh toward the midline and contributes to hip stabilization.',
        [muscle(v(s * 0.075, 0.59, 0.025), 0.04, 0.26, [0, 0, -s * 0.18])],
        { 'Muscles': 'Adductor longus, brevis, magnus and gracilis', 'Action': 'Hip adduction' }),
      anatomyComponent(`muscle_gastrocnemius_${suffix}`, `${label} Gastrocnemius`, 'Musculus Gastrocnemius', 'Calf muscle', 'muscular_system', MUSCLE_LIGHT,
        'A two-headed superficial calf muscle crossing both the knee and ankle.',
        'Plantarflexes the ankle and assists knee flexion.',
        [muscle(v(s * 0.16, 0.245, -0.062), 0.052, 0.16)],
        { 'Heads': 'Medial and lateral', 'Action': 'Ankle plantarflexion' }),
      anatomyComponent(`muscle_soleus_${suffix}`, `${label} Soleus`, 'Musculus Soleus', 'Calf muscle', 'muscular_system', MUSCLE,
        'A broad deep calf muscle lying beneath the gastrocnemius and joining the calcaneal tendon.',
        'Provides sustained plantarflexion and helps maintain upright posture.',
        [muscle(v(s * 0.155, 0.14, -0.052), 0.046, 0.16)],
        { 'Region': 'Deep posterior calf', 'Action': 'Ankle plantarflexion and postural support' }),
      anatomyComponent(`muscle_tibialis_anterior_${suffix}`, `${label} Tibialis Anterior`, 'Musculus Tibialis Anterior', 'Lower-leg muscle', 'muscular_system', MUSCLE_LIGHT,
        'A prominent muscle along the anterior shin with a tendon passing to the medial foot.',
        'Dorsiflexes and inverts the foot, helping clear the toes during walking.',
        [muscle(v(s * 0.12, 0.22, 0.055), 0.034, 0.24)],
        { 'Region': 'Anterior compartment of leg', 'Action': 'Foot dorsiflexion and inversion' }),
    ];
  }),
  anatomyComponent('muscle_rectus_abdominis', 'Rectus Abdominis', 'Musculus Rectus Abdominis', 'Abdominal muscle', 'muscular_system', MUSCLE_LIGHT,
    'A paired vertical muscle running along the anterior abdominal wall, divided by tendinous intersections.',
    'Flexes the trunk and compresses abdominal contents.',
    [ellipsoid(v(-0.052, 1.105, 0.122), v(0.045, 0.075, 0.027)), ellipsoid(v(0.052, 1.105, 0.122), v(0.045, 0.075, 0.027)),
     ellipsoid(v(-0.052, 1.025, 0.122), v(0.045, 0.068, 0.027)), ellipsoid(v(0.052, 1.025, 0.122), v(0.045, 0.068, 0.027)),
     ellipsoid(v(-0.052, 0.95, 0.122), v(0.045, 0.055, 0.027)), ellipsoid(v(0.052, 0.95, 0.122), v(0.045, 0.055, 0.027))],
    { 'Structure': 'Paired muscle with tendinous intersections', 'Action': 'Trunk flexion and abdominal compression' }),
  anatomyComponent('muscle_trapezius', 'Trapezius', 'Musculus Trapezius', 'Back muscle', 'muscular_system', MUSCLE,
    'A broad superficial triangular muscle extending from the occipital region and cervical-thoracic spine to the clavicle and scapula.',
    'Elevates, retracts, depresses and upwardly rotates the scapula depending on the fibres recruited.',
    [muscle(v(-0.12, 1.48, -0.105), 0.052, 0.28, [0, 0, -0.38]), muscle(v(0.12, 1.48, -0.105), 0.052, 0.28, [0, 0, 0.38])],
    { 'Regions': 'Upper, middle and lower fibres', 'Action': 'Scapular movement and stabilization' }),
];

const bones: ScientificComponent[] = [
  anatomyComponent('bone_cranium', 'Cranium', 'Neurocranium', 'Skull bone', 'skeletal_system', BONE,
    'The cranium is the bony case enclosing and protecting the brain. Its eight bones are joined mainly by immovable fibrous sutures.',
    'Protects the brain and provides attachment for the membranes and muscles of the head.',
    [ellipsoid(v(0, 1.84, -0.008), v(0.15, 0.17, 0.14)), ellipsoid(v(0, 1.77, 0.075), v(0.11, 0.09, 0.075))],
    { 'Cranial bones': '8', 'Main role': 'Protection of the brain' }),
  anatomyComponent('bone_mandible', 'Mandible', 'Mandibula', 'Facial bone', 'skeletal_system', BONE_SHADE,
    'The mandible is the lower jaw and the only freely movable bone of the skull.',
    'Supports the lower teeth and moves during chewing and speech.',
    [part('rib', v(0, 0, 0), { radius: 0.022, points: [v(-0.105, 1.70, 0.095), v(-0.08, 1.66, 0.13), v(0, 1.645, 0.145), v(0.08, 1.66, 0.13), v(0.105, 1.70, 0.095)] })],
    { 'Articulations': 'Right and left temporomandibular joints', 'Role': 'Mastication and speech' }),
  ...Array.from({ length: 7 }, (_, index) => {
    const y = 1.66 - index * 0.026;
    return anatomyComponent(`bone_cervical_${index + 1}`, `Cervical Vertebra C${index + 1}`, `Vertebra Cervicalis ${index + 1}`,
      'Vertebra', 'skeletal_system', BONE_SHADE,
      `Cervical vertebra ${index + 1} is part of the seven-vertebra neck region. The atlas (C1) and axis (C2) have specialised forms for head support and rotation.`,
      'Supports the head, protects the spinal cord and permits controlled neck movement.',
      [ellipsoid(v(0, y, -0.02), v(0.052, 0.018, 0.042)), ellipsoid(v(0, y, -0.07), v(0.025, 0.012, 0.05))],
      { 'Region': 'Cervical spine', 'Level': `C${index + 1}`, 'Count in region': '7' });
  }),
  ...Array.from({ length: 12 }, (_, index) => {
    const y = 1.46 - index * 0.034;
    return anatomyComponent(`bone_thoracic_${index + 1}`, `Thoracic Vertebra T${index + 1}`, `Vertebra Thoracica ${index + 1}`,
      'Vertebra', 'skeletal_system', BONE,
      `Thoracic vertebra ${index + 1} belongs to the rib-bearing middle section of the spine. Its costal facets articulate with the ribs.`,
      'Supports the thorax, protects the spinal cord and provides attachment for ribs and back muscles.',
      [ellipsoid(v(0, y, -0.02), v(0.064, 0.022, 0.05)), ellipsoid(v(0, y, -0.075), v(0.028, 0.013, 0.055))],
      { 'Region': 'Thoracic spine', 'Level': `T${index + 1}`, 'Count in region': '12', 'Rib articulation': 'Present' });
  }),
  ...Array.from({ length: 5 }, (_, index) => {
    const y = 1.01 - index * 0.034;
    return anatomyComponent(`bone_lumbar_${index + 1}`, `Lumbar Vertebra L${index + 1}`, `Vertebra Lumbalis ${index + 1}`,
      'Vertebra', 'skeletal_system', BONE_SHADE,
      `Lumbar vertebra ${index + 1} is part of the lower back. Lumbar vertebrae have large bodies adapted to carry substantial compressive loads.`,
      'Transfers upper-body load to the sacrum and permits trunk flexion, extension and lateral flexion.',
      [ellipsoid(v(0, y, -0.01), v(0.073, 0.027, 0.062)), ellipsoid(v(0, y, -0.085), v(0.032, 0.016, 0.06))],
      { 'Region': 'Lumbar spine', 'Level': `L${index + 1}`, 'Count in region': '5' });
  }),
  anatomyComponent('bone_sacrum', 'Sacrum & Coccyx', 'Os Sacrum et Os Coccygis', 'Axial bone', 'skeletal_system', BONE,
    'The sacrum is formed by five fused sacral vertebrae and joins the spine to the pelvic girdle. The coccyx is the small terminal segment.',
    'Transfers spinal load to the pelvic ring and provides ligament and muscle attachment.',
    [ellipsoid(v(0, 0.84, -0.045), v(0.075, 0.105, 0.05)), ellipsoid(v(0, 0.72, -0.035), v(0.035, 0.05, 0.03))],
    { 'Sacral vertebrae': '5 fused', 'Coccygeal vertebrae': 'Usually 3–5 fused', 'Role': 'Load transfer to pelvis' }),
  ...Array.from({ length: 12 }, (_, index) => ([-1, 1] as const).flatMap((side) => {
    const y = 1.43 - index * 0.034;
    const sideName = side < 0 ? 'left' : 'right';
    const sideLabel = side < 0 ? 'Left' : 'Right';
    const lengthScale = 0.62 + Math.sin((index / 11) * Math.PI) * 0.38;
    return anatomyComponent(`bone_rib_${index + 1}_${sideName}`, `${sideLabel} Rib ${index + 1}`, `Costa ${index + 1}`,
      'Rib bone', 'skeletal_system', BONE_SHADE,
      `Rib ${index + 1} is a curved bone of the thoracic cage. The first seven pairs are true ribs, pairs 8–10 are false ribs, and pairs 11–12 are floating ribs.`,
      'Protects thoracic organs and moves with the chest wall during breathing.',
      [rib([v(side * 0.035, y, -0.08), v(side * 0.16 * lengthScale, y - 0.014, -0.01), v(side * 0.25 * lengthScale, y - 0.045, 0.105), v(side * 0.21 * lengthScale, y - 0.07, 0.20)], 0.0105)],
      { 'Pair': String(index + 1), 'Classification': index < 7 ? 'True rib' : index < 10 ? 'False rib' : 'Floating rib', 'Side': sideLabel });
  })),
  anatomyComponent('bone_sternum', 'Sternum', 'Sternum', 'Axial bone', 'skeletal_system', BONE,
    'The sternum is a flat midline bone consisting of the manubrium, body and xiphoid process.',
    'Anchors the costal cartilages and helps protect structures in the anterior thorax.',
    [ellipsoid(v(0, 1.25, 0.205), v(0.038, 0.22, 0.025)), ellipsoid(v(0, 1.47, 0.18), v(0.065, 0.055, 0.03))],
    { 'Parts': 'Manubrium, body and xiphoid process', 'Rib pairs': '1–7 attach directly via cartilage' }),
  ...([-1, 1] as const).flatMap((side) => {
    const suffix = side < 0 ? 'left' : 'right', label = side < 0 ? 'Left' : 'Right';
    return [
      anatomyComponent(`bone_clavicle_${suffix}`, `${label} Clavicle`, 'Clavicula', 'Pectoral girdle bone', 'skeletal_system', BONE,
        'The clavicle is an S-shaped strut connecting the sternum to the scapula.',
        'Holds the shoulder laterally away from the thorax and transmits forces from the arm to the axial skeleton.',
        [part('rib', v(0, 0, 0), { radius: 0.022, points: [v(side * 0.045, 1.49, 0.04), v(side * 0.13, 1.505, 0.055), v(side * 0.21, 1.49, 0.025), v(side * 0.28, 1.46, 0)] })],
        { 'Articulations': 'Sternoclavicular and acromioclavicular joints', 'Shape': 'S-shaped strut' }),
      anatomyComponent(`bone_scapula_${suffix}`, `${label} Scapula`, 'Scapula', 'Pectoral girdle bone', 'skeletal_system', BONE_SHADE,
        'The scapula is a flat triangular bone on the posterior thorax with a glenoid cavity for the humeral head.',
        'Provides the socket for the shoulder joint and broad surfaces for muscle attachment.',
        [ellipsoid(v(side * 0.255, 1.36, -0.085), v(0.105, 0.16, 0.035), [0, 0, side * 0.22])],
        { 'Type': 'Flat bone', 'Key feature': 'Glenoid cavity', 'Position': 'Posterolateral thorax' }),
      anatomyComponent(`bone_humerus_${suffix}`, `${label} Humerus`, 'Humerus', 'Upper-limb bone', 'skeletal_system', BONE,
        'The humerus is the long bone of the upper arm, articulating with the scapula proximally and radius and ulna distally.',
        'Acts as the main skeletal lever for shoulder and elbow movement.',
        [bone(v(side * 0.335, 1.235, 0), 0.30, 0.025, 0.052, [0, 0, side * 0.20])],
        { 'Proximal articulation': 'Glenohumeral joint', 'Distal articulation': 'Elbow joint', 'Bone type': 'Long bone' }),
      anatomyComponent(`bone_radius_${suffix}`, `${label} Radius`, 'Radius', 'Forearm bone', 'skeletal_system', BONE_SHADE,
        'The radius is the lateral forearm bone on the thumb side in anatomical position.',
        'Rotates around the ulna during pronation and supination and participates in the wrist joint.',
        [bone(v(side * 0.385, 0.94, 0.026), 0.22, 0.014, 0.027, [0, 0, side * 0.06])],
        { 'Position': 'Lateral forearm', 'Distal articulation': 'Wrist', 'Bone type': 'Long bone' }),
      anatomyComponent(`bone_ulna_${suffix}`, `${label} Ulna`, 'Ulna', 'Forearm bone', 'skeletal_system', BONE,
        'The ulna is the medial forearm bone on the little-finger side in anatomical position and forms the prominent olecranon at the elbow.',
        'Provides a stable hinge articulation with the humerus and supports forearm rotation with the radius.',
        [bone(v(side * 0.425, 0.94, -0.025), 0.23, 0.014, 0.028, [0, 0, side * 0.06])],
        { 'Position': 'Medial forearm', 'Proximal feature': 'Olecranon', 'Bone type': 'Long bone' }),
      anatomyComponent(`bone_hand_${suffix}`, `${label} Hand Bones`, 'Ossa Manus', 'Hand bone groups', 'skeletal_system', BONE,
        'The hand contains eight carpals, five metacarpals and fourteen phalanges, arranged from the wrist toward the digits.',
        'Forms the flexible framework for grip, opposition and fine manipulation.',
        [ellipsoid(v(side * 0.43, 0.80, 0.015), v(0.057, 0.055, 0.03)),
         ...Array.from({ length: 5 }, (_, i) => capsule(v(side * (0.39 + i * 0.02), 0.72 - (i === 0 ? 0.02 : 0), 0.02), 0.009, 0.065, [0, 0, side * (i - 2) * 0.08]))],
        { 'Carpals': '8', 'Metacarpals': '5', 'Phalanges': '14', 'Total per hand': '27' }),
      anatomyComponent(`bone_hip_${suffix}`, `${label} Hip Bone`, 'Os Coxae', 'Pelvic bone', 'skeletal_system', BONE_SHADE,
        'Each hip bone forms from the fused ilium, ischium and pubis and joins the sacrum at the sacroiliac joint.',
        'Forms the pelvic ring, transfers load and provides the acetabulum for the femoral head.',
        [ellipsoid(v(side * 0.145, 0.83, -0.02), v(0.13, 0.13, 0.045), [0, 0, side * 0.18]),
         ellipsoid(v(side * 0.085, 0.77, 0.08), v(0.07, 0.06, 0.035))],
        { 'Fused parts': 'Ilium, ischium and pubis', 'Articulations': 'Sacroiliac joint and hip joint' }),
      anatomyComponent(`bone_femur_${suffix}`, `${label} Femur`, 'Femur', 'Lower-limb bone', 'skeletal_system', BONE,
        'The femur is the long bone of the thigh, with a head that fits into the acetabulum and condyles that articulate with the tibia.',
        'Transfers body weight between the hip and knee and provides leverage for locomotion.',
        [bone(v(side * 0.145, 0.59, 0), 0.31, 0.033, 0.065)],
        { 'Bone type': 'Long bone', 'Proximal articulation': 'Hip joint', 'Distal articulation': 'Knee joint' }),
      anatomyComponent(`bone_patella_${suffix}`, `${label} Patella`, 'Patella', 'Sesamoid bone', 'skeletal_system', BONE_SHADE,
        'The patella is a sesamoid bone embedded in the quadriceps tendon at the front of the knee.',
        'Protects the anterior knee and improves the leverage of the quadriceps during extension.',
        [ellipsoid(v(side * 0.15, 0.385, 0.065), v(0.043, 0.057, 0.022))],
        { 'Bone type': 'Sesamoid', 'Joint': 'Patellofemoral articulation' }),
      anatomyComponent(`bone_tibia_${suffix}`, `${label} Tibia`, 'Tibia', 'Lower-leg bone', 'skeletal_system', BONE,
        'The tibia is the larger medial bone of the lower leg and carries most of the load transmitted from the knee to the ankle.',
        'Primary weight-bearing bone of the lower leg.',
        [bone(v(side * 0.15, 0.22, 0), 0.25, 0.024, 0.045)],
        { 'Position': 'Medial lower leg', 'Bone type': 'Long bone', 'Role': 'Primary weight-bearing bone' }),
      anatomyComponent(`bone_fibula_${suffix}`, `${label} Fibula`, 'Fibula', 'Lower-leg bone', 'skeletal_system', BONE_SHADE,
        'The fibula is the slender lateral bone of the lower leg, running alongside the tibia.',
        'Provides muscle attachment and contributes the lateral malleolus to ankle stability.',
        [bone(v(side * 0.205, 0.22, -0.01), 0.24, 0.012, 0.023)],
        { 'Position': 'Lateral lower leg', 'Bone type': 'Long bone', 'Weight bearing': 'Limited compared with tibia' }),
      anatomyComponent(`bone_foot_${suffix}`, `${label} Foot Bones`, 'Ossa Pedis', 'Foot bone groups', 'skeletal_system', BONE,
        'The foot has seven tarsals, five metatarsals and fourteen phalanges, forming the ankle and longitudinal and transverse arches.',
        'Distributes load, maintains balance and provides a rigid lever for push-off.',
        [ellipsoid(v(side * 0.155, 0.055, 0.04), v(0.055, 0.038, 0.06)),
         ...Array.from({ length: 5 }, (_, i) => capsule(v(side * (0.12 + i * 0.017), 0.045, 0.14 + (i === 0 ? 0.01 : 0)), 0.009, 0.09, [0.08, 0, 0]))],
        { 'Tarsals': '7', 'Metatarsals': '5', 'Phalanges': '14', 'Total per foot': '26' }),
    ];
  }),
];

const joints: ScientificComponent[] = [
  ...([-1, 1] as const).flatMap((side) => {
    const suffix = side < 0 ? 'left' : 'right', label = side < 0 ? 'Left' : 'Right';
    return [
      anatomyComponent(`joint_shoulder_${suffix}`, `${label} Shoulder Joint`, 'Articulatio Humeri', 'Ball-and-socket joint', 'joint_system', CARTILAGE,
        'The glenohumeral joint is a synovial ball-and-socket articulation between the humeral head and the glenoid cavity of the scapula.',
        'Permits flexion, extension, abduction, adduction, rotation and circumduction.',
        [joint(v(side * 0.255, 1.445, 0.008), 0.048)],
        { 'Joint class': 'Synovial ball-and-socket', 'Bones': 'Scapula and humerus', 'Stabilizers': 'Labrum, capsule, ligaments and rotator cuff' }),
      anatomyComponent(`joint_elbow_${suffix}`, `${label} Elbow Joint`, 'Articulatio Cubiti', 'Hinge-dominant joint', 'joint_system', CARTILAGE,
        'The elbow complex includes humeroulnar and humeroradial articulations within a shared capsule.',
        'Primarily flexes and extends the forearm; the nearby radioulnar joints permit rotation.',
        [joint(v(side * 0.37, 1.075, 0.005), 0.037)],
        { 'Joint class': 'Hinge-dominant synovial complex', 'Bones': 'Humerus, ulna and radius', 'Movement': 'Flexion and extension' }),
      anatomyComponent(`joint_wrist_${suffix}`, `${label} Wrist Joint`, 'Articulatio Radiocarpalis', 'Condyloid joint', 'joint_system', CARTILAGE,
        'The radiocarpal joint is formed mainly between the distal radius and the proximal carpal row.',
        'Permits flexion, extension, radial deviation and ulnar deviation.',
        [joint(v(side * 0.41, 0.825, 0.012), 0.031)],
        { 'Joint class': 'Condyloid synovial', 'Bones': 'Radius and proximal carpal row', 'Movement': 'Flexion, extension and deviation' }),
      anatomyComponent(`joint_hip_${suffix}`, `${label} Hip Joint`, 'Articulatio Coxae', 'Ball-and-socket joint', 'joint_system', CARTILAGE,
        'The hip joint is a deep synovial ball-and-socket articulation between the femoral head and acetabulum.',
        'Transfers body weight and permits flexion, extension, abduction, adduction and rotation.',
        [joint(v(side * 0.145, 0.83, 0.02), 0.052)],
        { 'Joint class': 'Synovial ball-and-socket', 'Bones': 'Hip bone and femur', 'Stabilizers': 'Acetabular labrum and strong ligaments' }),
      anatomyComponent(`joint_knee_${suffix}`, `${label} Knee Joint`, 'Articulatio Genus', 'Modified hinge joint', 'joint_system', CARTILAGE,
        'The knee includes tibiofemoral and patellofemoral articulations with menisci, ligaments and a joint capsule.',
        'Allows flexion and extension with a small amount of rotation when flexed.',
        [joint(v(side * 0.15, 0.385, 0.015), 0.049)],
        { 'Joint class': 'Modified hinge synovial', 'Bones': 'Femur, tibia and patella', 'Key structures': 'Menisci, ACL, PCL, MCL and LCL' }),
      anatomyComponent(`joint_ankle_${suffix}`, `${label} Ankle Joint`, 'Articulatio Talocruralis', 'Hinge joint', 'joint_system', CARTILAGE,
        'The talocrural joint is formed by the distal tibia and fibula articulating with the talus.',
        'Produces dorsiflexion and plantarflexion of the foot.',
        [joint(v(side * 0.155, 0.075, 0.006), 0.034)],
        { 'Joint class': 'Synovial hinge', 'Bones': 'Tibia, fibula and talus', 'Movement': 'Dorsiflexion and plantarflexion' }),
      anatomyComponent(`joint_sacroiliac_${suffix}`, `${label} Sacroiliac Joint`, 'Articulatio Sacroiliaca', 'Plane synovial joint', 'joint_system', CARTILAGE,
        'The sacroiliac joint joins the auricular surface of the ilium to the sacrum and is reinforced by strong ligaments.',
        'Transfers loads between the spine and the pelvic ring with only small movements.',
        [joint(v(side * 0.075, 0.84, -0.05), 0.029)],
        { 'Joint class': 'Plane synovial with strong ligamentous support', 'Bones': 'Sacrum and ilium' }),
      anatomyComponent(`joint_tmj_${suffix}`, `${label} Temporomandibular Joint`, 'Articulatio Temporomandibularis', 'Modified hinge / gliding joint', 'joint_system', CARTILAGE,
        'The temporomandibular joint is a paired articulation between the mandibular condyle and temporal bone, with an articular disc.',
        'Allows jaw opening, closing, protrusion, retraction and side-to-side movement.',
        [joint(v(side * 0.105, 1.70, 0.06), 0.024)],
        { 'Joint class': 'Modified hinge with gliding', 'Bones': 'Mandible and temporal bone', 'Articular disc': 'Present' }),
    ];
  }),
  anatomyComponent('joint_pubic_symphysis', 'Pubic Symphysis', 'Symphysis Pubica', 'Cartilaginous joint', 'joint_system', CARTILAGE,
    'The pubic symphysis joins the left and right pubic bones through a fibrocartilaginous disc.',
    'Maintains pelvic-ring continuity while allowing a small amount of movement.',
    [joint(v(0, 0.775, 0.105), 0.03)],
    { 'Joint class': 'Secondary cartilaginous symphysis', 'Connecting tissue': 'Fibrocartilaginous disc' }),
  anatomyComponent('joint_atlanto_occipital', 'Atlanto-occipital Joint', 'Articulatio Atlantooccipitalis', 'Condyloid joint', 'joint_system', CARTILAGE,
    'Paired joints between the occipital condyles and the superior articular facets of the atlas (C1).',
    'Allows nodding movements of the head, mainly flexion and extension.',
    [joint(v(0, 1.68, -0.035), 0.031)],
    { 'Bones': 'Occipital bone and atlas (C1)', 'Joint class': 'Condyloid synovial' }),
  anatomyComponent('joint_intervertebral_discs', 'Intervertebral Discs', 'Disci Intervertebrales', 'Secondary cartilaginous joints', 'joint_system', CARTILAGE,
    'Fibrocartilaginous discs lie between most adjacent vertebral bodies from C2–C3 to L5–S1.',
    'Distribute compressive load and permit small movements that combine into spinal flexibility.',
    [capsule(v(0, 1.52, -0.008), 0.025, 0.42), capsule(v(0, 1.19, -0.008), 0.03, 0.40), capsule(v(0, 0.93, -0.008), 0.032, 0.18)],
    { 'Tissue': 'Annulus fibrosus and nucleus pulposus', 'Count': '23 discs in a typical adult' }),
];

export const HUMAN_BODY_COMPONENTS = body;
export const HUMAN_MUSCLE_COMPONENTS = muscles;
export const HUMAN_BONE_COMPONENTS = bones;
export const HUMAN_JOINT_COMPONENTS = joints;
export const HUMAN_ANATOMY_LAYER_COMPONENTS = [...body, ...muscles, ...bones, ...joints];

export const HUMAN_ANATOMY_LAYER_ROOT_IDS = {
  body: body.map((component) => component.id),
  muscles: muscles.map((component) => component.id),
  skeleton: [...bones, ...joints].map((component) => component.id),
};
