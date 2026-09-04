import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # 1. activeLearningSession.subject
    content = content.replace("activeLearningSession.subject", "activeLearningSession.context?.entity || activeLearningSession.context?.topic")
    
    # 2. handTracking?.detected
    content = content.replace("handTracking?.detected", "(handTracking?.handsDetected ?? 0) > 0")
    
    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/SystemPanels.tsx')
fix_file('src/ViewModal.tsx')

