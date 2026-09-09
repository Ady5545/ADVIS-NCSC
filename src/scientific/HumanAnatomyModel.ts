import { ScientificSystemModel } from './ScientificSchema';

export const HumanAnatomyModel: ScientificSystemModel = {
  id: 'human_anatomy_scientific',
  name: 'Human Anatomy Atlas',
  scientificTitle: 'Integrated Human Anatomical Systems & Cardiovascular Hemodynamics',
  domain: 'ANATOMY',
  description: 'A multi-tier hierarchical anatomical atlas featuring independently addressable organ systems, cardiovascular hemodynamics, pulmonary pathways, and neural innervation networks.',

  subsystems: [
    {
      id: 'cardiovascular_system',
      name: 'Cardiovascular & Hemodynamic System',
      description: 'Closed circulatory network comprising the four-chambered heart, systemic arteries, microvascular capillary beds, and venous return channels.',
      color: '#ef4444', // red-500
      rootComponentIds: ['heart_myocardium', 'ascending_aorta', 'superior_vena_cava']
    },
    {
      id: 'respiratory_system',
      name: 'Respiratory & Gas Exchange System',
      description: 'Airways and bilateral lungs providing gas exchange across the alveolar-capillary membrane driven by diaphragmatic negative pressure.',
      color: '#06b6d4', // cyan-500
      rootComponentIds: ['trachea', 'pulmonary_trunk', 'left_lung', 'right_lung', 'diaphragm']
    },
    {
      id: 'skeletal_system',
      name: 'Axial & Appendicular Skeletal System',
      description: 'Mineralized osseous framework protecting vital thoracic organs, housing bone marrow, and anchoring musculoskeletal levers.',
      color: '#e2e8f0', // slate-200
      rootComponentIds: ['cranium', 'vertebral_column', 'rib_cage', 'sternum']
    },
    {
      id: 'nervous_system',
      name: 'Central & Autonomic Nervous System',
      description: 'High-speed electro-chemical signaling network coordinating cardiac pacemaker nodal rhythms and somatic motor feedback.',
      color: '#eab308', // yellow-500
      rootComponentIds: ['cerebrum', 'brainstem', 'spinal_cord', 'vagus_nerve']
    }
  ],

  components: {
    // 1. HEART MYOCARDIUM
    'heart_myocardium': {
      id: 'heart_myocardium',
      name: 'Heart (Myocardium)',
      scientificName: 'Cardiac Myocardium & Pericardial Sac',
      category: 'Muscular Pump',
      subsystemId: 'cardiovascular_system',
      parentId: null,
      childrenIds: ['left_ventricle', 'right_ventricle', 'left_atrium', 'right_atrium'],
      geometry: {
        type: 'anatomical_organ',
        params: { organType: 'heart', radius: 0.65 },
        material: {
          color: '#dc2626', // Deep crimson
          metalness: 0.15,
          roughness: 0.45
        },
        transform: {
          position: [-0.15, 0.45, 0.2],
          rotation: [0.1, 0.2, -0.2],
          scale: [1, 1, 1]
        },
        explodedOffset: [-0.6, 0.45, 1.2],
        explosionDirection: [-0.5, 0, 1]
      },
      kinematicBinding: {
        driverVariable: 'cardiacPulsation',
        type: 'TRANSLATION_Y',
        multiplier: 0.08
      },
      education: {
        name: 'Heart (Myocardium)',
        scientificName: 'Cor Humanum',
        definition: 'A four-chambered myogenic muscular organ that pumps deoxygenated blood to the lungs and oxygen-rich blood to systemic tissue via rhythmic contractions.',
        function: 'Executes synchronized mechanical systole (contraction) and diastole (relaxation) controlled by electrical impulses from the sinoatrial (SA) node.',
        importance: 'Supplies all cellular tissues with continuous oxygenated blood; cessation of output causes irreversible neural death within 4 minutes.',
        realWorldRelevance: 'Beats approximately 100,000 times daily, generating sufficient hydraulic force to propel blood through 100,000 kilometers of blood vessels.',
        governingEquations: [
          {
            name: 'Cardiac Output',
            formula: 'CO = HR × SV',
            description: 'Total volume pumped per minute equals Heart Rate multiplied by Stroke Volume (~5 L/min at rest).'
          },
          {
            name: 'Mean Arterial Pressure',
            formula: 'MAP ≈ DP + (1/3)(SP - DP)',
            description: 'Average hydraulic perfusion pressure determined by diastolic pressure DP and systolic pressure SP.'
          }
        ],
        failureModes: ['Myocardial infarction (ischemic necrosis)', 'Congestive heart failure', 'Ventricular fibrillation']
      },
      scientificProperties: {
        'Resting Cardiac Output': { value: 5.2, unit: 'L/min', description: 'Average adult blood volume circulated every minute' },
        'Myocardial Mass': { value: 310, unit: 'g', description: 'Left ventricular wall thickness ~12mm' },
        'Ejection Fraction': { value: 62, unit: '%', description: 'Percentage of end-diastolic volume pumped per stroke' }
      }
    },

    // 2. LEFT VENTRICLE
    'left_ventricle': {
      id: 'left_ventricle',
      name: 'Left Ventricle',
      scientificName: 'Ventriculus Sinister Cordis',
      category: 'Cardiac Chamber',
      subsystemId: 'cardiovascular_system',
      parentId: 'heart_myocardium',
      childrenIds: ['mitral_valve', 'aortic_valve'],
      geometry: {
        type: 'sphere',
        params: { radius: 0.38, widthSegments: 24, heightSegments: 16 },
        material: {
          color: '#b91c1c',
          metalness: 0.2,
          roughness: 0.5
        },
        transform: {
          position: [-0.25, 0.32, 0.25],
          rotation: [0, 0, 0],
          scale: [0.9, 1.2, 0.9]
        },
        explodedOffset: [-0.8, 0.3, 1.5],
        explosionDirection: [-1, 0, 1]
      },
      education: {
        name: 'Left Ventricle',
        scientificName: 'Ventriculus Sinister',
        definition: 'The thickest and most powerful muscular chamber of the heart responsible for pumping oxygenated blood into the aorta.',
        function: 'Overcomes high systemic vascular resistance by generating peak systolic pressures of 120 mmHg to perfuse the entire body.',
        importance: 'Its thick 8–12 mm muscular wall generates 6 times the hydraulic pressure of the right ventricle.'
      },
      scientificProperties: {
        'Peak Systolic Pressure': { value: 120, unit: 'mmHg', description: 'Normal systemic peak systolic pressure' },
        'End-Diastolic Volume': { value: 120, unit: 'mL', description: 'Maximum chamber filling volume prior to contraction' },
        'Stroke Volume': { value: 75, unit: 'mL', description: 'Blood volume ejected into aorta per beat' }
      }
    },

    // 3. ASCENDING AORTA
    'ascending_aorta': {
      id: 'ascending_aorta',
      name: 'Ascending Aorta & Arch',
      scientificName: 'Aorta Ascendens & Arcus Aortae',
      category: 'Elastic Artery',
      subsystemId: 'cardiovascular_system',
      parentId: 'heart_myocardium',
      childrenIds: [],
      geometry: {
        type: 'torus',
        params: { radius: 0.42, tube: 0.08, radialSegments: 16, tubularSegments: 32, arc: Math.PI * 0.9 },
        material: {
          color: '#ef4444',
          metalness: 0.3,
          roughness: 0.35
        },
        transform: {
          position: [-0.15, 0.82, 0.15],
          rotation: [Math.PI / 2, 0, -0.3],
          scale: [1, 1, 1]
        },
        explodedOffset: [-0.15, 1.6, 0.4],
        explosionDirection: [0, 1, 0]
      },
      education: {
        name: 'Aorta & Aortic Arch',
        scientificName: 'Aorta Ascendens',
        definition: 'The main trunk of systemic arterial circulation carrying oxygenated blood directly from the left ventricle.',
        function: 'Acts as an elastic reservoir (Windkessel effect): expands during systole to buffer pressure peaks and recoils during diastole to maintain continuous peripheral flow.',
        importance: 'Subject to the highest cyclic hydraulic pressure in the human body throughout a lifetime.'
      },
      scientificProperties: {
        'Vessel Diameter': { value: 28.0, unit: 'mm', description: 'Root diameter at sinuses of Valsalva' },
        'Wall Compliance': { value: 'High Elastin Matrix', description: 'Windkessel buffering compliance' }
      }
    },

    // 4. MITRAL VALVE
    'mitral_valve': {
      id: 'mitral_valve',
      name: 'Mitral Valve (Bicuspid)',
      scientificName: 'Valva Atrioventricularis Sinistra',
      category: 'Atrioventricular Valve',
      subsystemId: 'cardiovascular_system',
      parentId: 'left_ventricle',
      childrenIds: [],
      geometry: {
        type: 'torus',
        params: { radius: 0.16, tube: 0.025 },
        material: {
          color: '#f8fafc',
          metalness: 0.1,
          roughness: 0.6
        },
        transform: {
          position: [-0.22, 0.48, 0.22],
          rotation: [Math.PI / 4, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [-0.5, 0.9, 0.8],
        explosionDirection: [-0.5, 1, 0.5]
      },
      education: {
        name: 'Mitral Valve',
        scientificName: 'Bicuspid Atrioventricular Valve',
        definition: 'A dual-flap valve located between the left atrium and left ventricle anchored by fibrous chordae tendineae.',
        function: 'Prevents backward regurgitation of blood from the left ventricle into the left atrium during ventricular contraction.',
        importance: 'Withstands over 120 mmHg systolic pressure differentials without prolapsing into the atrium.'
      },
      scientificProperties: {
        'Orifice Area': { value: 4.5, unit: 'cm²', description: 'Normal unobstructed opening area' }
      }
    },

    // 5. TRACHEA & BRONCHI
    'trachea': {
      id: 'trachea',
      name: 'Trachea & Primary Bronchi',
      scientificName: 'Trachea & Bronchi Principales',
      category: 'Cartilaginous Airway',
      subsystemId: 'respiratory_system',
      parentId: null,
      childrenIds: ['left_lung', 'right_lung'],
      geometry: {
        type: 'cylinder',
        params: { radiusTop: 0.08, radiusBottom: 0.08, height: 0.85, radialSegments: 20 },
        material: {
          color: '#93c5fd', // Light blue
          metalness: 0.1,
          roughness: 0.4
        },
        transform: {
          position: [0, 1.05, 0.05],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [0, 1.8, -0.3],
        explosionDirection: [0, 1, 0]
      },
      education: {
        name: 'Trachea (Windpipe)',
        scientificName: 'Trachea',
        definition: 'A flexible cartilaginous tube connecting the larynx to the primary bronchi that conducts atmospheric air into the lungs.',
        function: 'Maintains open airway patency via 16–20 C-shaped hyaline cartilage rings while ciliated respiratory epithelium sweeps inhaled particulate matter upward.',
        importance: 'Provides the sole conduit for respiratory ventilation; complete obstruction causes asphyxiation within 3 minutes.'
      },
      scientificProperties: {
        'Length': { value: 11.5, unit: 'cm', description: 'Extends from C6 to T4/T5 carina' },
        'Internal Diameter': { value: 20.0, unit: 'mm', description: 'Adult trachea cross-section' }
      }
    },

    // 6. LEFT LUNG
    'left_lung': {
      id: 'left_lung',
      name: 'Left Lung',
      scientificName: 'Pulmo Sinister (2 Lobes)',
      category: 'Pulmonary Parenchyma',
      subsystemId: 'respiratory_system',
      parentId: 'trachea',
      childrenIds: [],
      geometry: {
        type: 'anatomical_organ',
        params: { organType: 'lung_left', radius: 0.55 },
        material: {
          color: '#f472b6', // Pinkish pulmonary hue
          metalness: 0.1,
          roughness: 0.7,
          opacity: 0.7,
          transparent: true
        },
        transform: {
          position: [-0.55, 0.5, 0.0],
          rotation: [0, 0, -0.1],
          scale: [0.8, 1.3, 0.85]
        },
        explodedOffset: [-1.6, 0.5, 0.0],
        explosionDirection: [-1, 0, 0]
      },
      education: {
        name: 'Left Lung',
        scientificName: 'Pulmo Sinister',
        definition: 'Bilateral respiratory organ divided into superior and inferior lobes separated by the oblique fissure, featuring a cardiac notch to accommodate the heart.',
        function: 'Facilitates passive diffusion of oxygen into pulmonary capillary erythrocytes and eliminates carbon dioxide byproduct via 300 million alveoli.',
        importance: 'Provides over 70 square meters of gas exchange surface area (equivalent to half a tennis court).'
      },
      scientificProperties: {
        'Total Alveolar Surface Area': { value: 75.0, unit: 'm²', description: 'Massive diffusion boundary' },
        'Vital Capacity': { value: 4.6, unit: 'L', description: 'Maximum expiratory volume' }
      }
    },

    // 7. SKELETAL RIBCAGE
    'rib_cage': {
      id: 'rib_cage',
      name: 'Thoracic Rib Cage',
      scientificName: 'Cavea Thoracis (12 Paired Costae)',
      category: 'Osseous Protection',
      subsystemId: 'skeletal_system',
      parentId: null,
      childrenIds: ['sternum'],
      geometry: {
        type: 'box',
        params: { width: 1.5, height: 1.4, depth: 1.1 },
        material: {
          color: '#f8fafc',
          metalness: 0.1,
          roughness: 0.8,
          opacity: 0.25,
          transparent: true,
          wireframe: true
        },
        transform: {
          position: [0, 0.55, 0.05],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        explodedOffset: [0, 0.55, 1.8],
        explosionDirection: [0, 0, 1]
      },
      education: {
        name: 'Thoracic Rib Cage',
        scientificName: 'Thorax Osseus',
        definition: 'A cage-like skeletal structure formed by 12 pairs of ribs, costal cartilages, thoracic vertebrae, and sternum.',
        function: 'Protects delicate cardiopulmonary organs while elevating via intercostal muscles during inhalation (bucket-handle and pump-handle biomechanics).',
        importance: 'Creates rigid structural protection while permitting volumetric thoracic expansion for negative-pressure breathing.'
      },
      scientificProperties: {
        'Costal Pairs': { value: 12, description: '7 true ribs, 3 false ribs, 2 floating ribs' }
      }
    },

    // 8. BRAIN & BRAINSTEM
    'cerebrum': {
      id: 'cerebrum',
      name: 'Brain (Cerebrum & Brainstem)',
      scientificName: 'Encephalon & Truncus Encephali',
      category: 'Neural Controller',
      subsystemId: 'nervous_system',
      parentId: null,
      childrenIds: [],
      geometry: {
        type: 'sphere',
        params: { radius: 0.42, widthSegments: 32, heightSegments: 24 },
        material: {
          color: '#fde047', // Warm neural gold
          metalness: 0.1,
          roughness: 0.55
        },
        transform: {
          position: [0, 1.9, 0],
          rotation: [0, 0, 0],
          scale: [0.95, 1.1, 1.25]
        },
        explodedOffset: [0, 2.9, 0],
        explosionDirection: [0, 1, 0]
      },
      education: {
        name: 'Brain (Encephalon)',
        scientificName: 'Cerebrum, Cerebellum & Medulla',
        definition: 'The central computational and control organ of the human nervous system containing 86 billion interconnected neurons.',
        function: 'The medulla oblongata and pons within the brainstem house the autonomous cardiovascular and respiratory pacemaker control centers.',
        importance: 'Consumes 20% of resting human metabolic energy and arterial glucose while accounting for only 2% of total body mass.'
      },
      scientificProperties: {
        'Neuron Count': { value: '86 Billion', description: 'Synaptic connections exceed 100 trillion' },
        'Resting Metabolic Fraction': { value: 20, unit: '%', description: 'Proportion of basal oxygen consumed' }
      }
    }
  },

  relationships: [
    {
      sourceId: 'left_ventricle',
      targetId: 'ascending_aorta',
      type: 'PUMPS',
      description: 'Left ventricle ejects pressurized oxygenated blood through the aortic valve into the aorta.',
      transferType: 'FLUID'
    },
    {
      sourceId: 'heart_myocardium',
      targetId: 'left_ventricle',
      type: 'PART_OF',
      description: 'Left ventricle forms the thick anterior-lateral muscular apex of the myocardium.',
      transferType: 'BIOLOGICAL'
    },
    {
      sourceId: 'left_ventricle',
      targetId: 'mitral_valve',
      type: 'CONTROLS',
      description: 'Ventricular pressure differential forces mitral valve leaflets shut during systole.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'trachea',
      targetId: 'left_lung',
      type: 'SUPPLIED_BY',
      description: 'Supplies atmospheric ventilation airflow directly to the left bronchial tree.',
      transferType: 'FLUID'
    },
    {
      sourceId: 'rib_cage',
      targetId: 'heart_myocardium',
      type: 'SURROUNDS',
      description: 'Bony thoracic rib cage encloses and shields the mediastinal pericardium.',
      transferType: 'MECHANICAL'
    },
    {
      sourceId: 'cerebrum',
      targetId: 'heart_myocardium',
      type: 'CONTROLS',
      description: 'Autonomic vagus and sympathetic cardiac nerves modulate heart rate and contractility in response to arterial baroreceptors.',
      transferType: 'ELECTRICAL'
    }
  ],

  simulation: {
    variables: {
      'cardiacPulsation': {
        id: 'cardiacPulsation',
        name: 'Ventricular Wall Motion',
        unit: 'mm',
        defaultValue: 0,
        isDynamic: true,
        description: 'Periodic systolic contraction and diastolic filling deformation of ventricular myocardium'
      },
      'bloodPressure': {
        id: 'bloodPressure',
        name: 'Aortic Blood Pressure',
        unit: 'mmHg',
        defaultValue: 118,
        min: 60,
        max: 180,
        isDynamic: true,
        description: 'Instantaneous hydraulic arterial pressure in ascending aorta'
      },
      'cardiacCycleProgress': {
        id: 'cardiacCycleProgress',
        name: 'Wiggers Cycle Angle',
        unit: 'deg',
        defaultValue: 0,
        min: 0,
        max: 360,
        isDynamic: true,
        description: 'Phase progress through electrocardiographic P-Q-R-S-T cardiac cycle'
      },
      'leftVentricularVolume': {
        id: 'leftVentricularVolume',
        name: 'Left Ventricular Volume',
        unit: 'mL',
        defaultValue: 110,
        min: 45,
        max: 130,
        isDynamic: true,
        description: 'Instantaneous intracardiac blood volume during diastolic filling and systolic ejection'
      }
    },

    parameters: {
      'heartRate': 72,             // Beats per minute
      'strokeVolume': 70,          // mL per beat
      'systemicVascularResistance': 1.1 // mmHg·min/L
    },

    cyclePhases: [
      {
        id: 'VENTRICULAR_DIASTOLE',
        name: 'Ventricular Diastole (Passive & Active Filling)',
        startVal: 0,
        endVal: 150,
        description: 'Ventricles relax. Atrioventricular (mitral/tricuspid) valves open. Blood flows passively from atria into ventricles, followed by atrial contraction kick.',
        color: '#38bdf8',
        activeValves: ['mitral_valve'],
        thermoState: 'Low pressure ventricular filling (P ≈ 6–10 mmHg)'
      },
      {
        id: 'ISOVOLUMETRIC_CONTRACTION',
        name: 'Isovolumetric Contraction',
        startVal: 150,
        endVal: 190,
        description: 'Ventricular myocardium contracts. Intracardiac pressure exceeds atrial pressure, slamming mitral valve shut (S1 heart sound). Volume remains constant.',
        color: '#eab308',
        activeValves: [],
        thermoState: 'Rapid isovolumetric pressure spike to 80 mmHg'
      },
      {
        id: 'VENTRICULAR_SYSTOLE',
        name: 'Rapid & Reduced Ventricular Ejection',
        startVal: 190,
        endVal: 300,
        description: 'Left ventricular pressure surpasses aortic diastolic threshold (80 mmHg). Aortic valve opens; 70 mL stroke volume is forcefully ejected into aorta.',
        color: '#ef4444',
        activeValves: ['aortic_valve'],
        thermoState: 'Peak Systolic Pressure (P = 120 mmHg)'
      },
      {
        id: 'ISOVOLUMETRIC_RELAXATION',
        name: 'Isovolumetric Relaxation',
        startVal: 300,
        endVal: 360,
        description: 'Ventricles repolarize and relax. Aortic backflow closes aortic valve (S2 heart sound). All four valves remain closed until ventricular pressure drops below atrial.',
        color: '#a855f7',
        activeValves: [],
        thermoState: 'Dicrotic notch pressure oscillation'
      }
    ],

    stepFunction: (state, dt, params) => {
      const hr = params['heartRate'] || 72;
      // Cycle duration in seconds: 60 / HR
      const cycleDuration = 60 / hr;
      const degPerSec = 360 / cycleDuration;

      let newAngle = (state['cardiacCycleProgress'] + degPerSec * dt) % 360;
      if (newAngle < 0) newAngle += 360;

      // Wiggers hemodynamic waveform:
      let bp = 80;
      let lvVol = 120;
      let pulse = 0;

      if (newAngle < 150) {
        // Diastole: pressure low, volume filling
        const p = newAngle / 150;
        bp = 80 - 8 * Math.exp(-p * 2);
        lvVol = 50 + 70 * Math.pow(p, 0.7);
        pulse = -0.04 * (1 - p);
      } else if (newAngle >= 150 && newAngle < 190) {
        // Isovolumetric contraction: volume constant, pressure rising
        const p = (newAngle - 150) / 40;
        bp = 78 + 4 * p;
        lvVol = 120;
        pulse = 0.05 * p;
      } else if (newAngle >= 190 && newAngle < 300) {
        // Systolic ejection: pressure peaks at 120 mmHg, volume empties to 50 mL
        const p = (newAngle - 190) / 110;
        bp = 82 + 38 * Math.sin(p * Math.PI);
        lvVol = 120 - 70 * Math.sin(p * (Math.PI / 2));
        pulse = 0.08 * Math.sin(p * Math.PI);
      } else {
        // Isovolumetric relaxation
        const p = (newAngle - 300) / 60;
        bp = 80 + 10 * Math.exp(-p * 3) * Math.cos(p * Math.PI * 2); // Dicrotic notch
        lvVol = 50;
        pulse = 0.02 * (1 - p);
      }

      return {
        ...state,
        cardiacCycleProgress: newAngle,
        bloodPressure: bp,
        leftVentricularVolume: lvVol,
        cardiacPulsation: pulse
      };
    }
  },

  diagrams: [
    {
      id: 'wiggers_cardiac_cycle',
      title: 'Wiggers Diagram (ECG, Pressure, Volume)',
      type: 'PV_DIAGRAM',
      description: 'Synchronized hemodynamic chart showing simultaneous left ventricular pressure, aortic pressure, and ventricular volume curves across one heartbeat.',
      parametersTracked: ['bloodPressure', 'leftVentricularVolume', 'cardiacCycleProgress']
    },
    {
      id: 'cardiac_phase_dial',
      title: 'Cardiac Phase & Valvular State',
      type: 'FOUR_STROKE_CYCLE',
      description: 'Continuous indicator tracking Diastole, Isovolumetric Contraction, Systolic Ejection, and Isovolumetric Relaxation with valve closure milestones.',
      parametersTracked: ['cardiacCycleProgress']
    }
  ]
};
