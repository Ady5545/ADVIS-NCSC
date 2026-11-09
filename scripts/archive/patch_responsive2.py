import re

with open('src/ScientificHUD.tsx', 'r') as f:
    content = f.read()

# Make top-left responsive
content = content.replace(
    '<div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-auto flex flex-col gap-2 max-w-[320px] md:max-w-[360px] animate-fade-in">',
    '<div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-auto flex flex-col gap-2 max-w-[320px] md:max-w-[360px] max-h-[40vh] md:max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in z-40">'
)

# Top right
content = content.replace(
    '<div className={`absolute top-16 right-4 md:top-6 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[280px] md:max-w-[320px] animate-fade-in transition-all z-40 ${showControlsOnMobile ? \'block\' : \'hidden md:flex\'}`}>',
    '<div className={`absolute top-16 right-4 md:top-6 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[280px] md:max-w-[320px] max-h-[40vh] md:max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in transition-all z-40 ${showControlsOnMobile ? \'flex\' : \'hidden md:flex\'}`}>'
)

# Bottom left
content = content.replace(
    '<div className="absolute bottom-24 left-4 md:bottom-28 md:left-6 pointer-events-auto flex flex-col gap-2 max-w-[320px] md:max-w-[380px] animate-fade-in">',
    '<div className={`absolute bottom-24 left-4 md:bottom-28 md:left-6 pointer-events-auto flex flex-col gap-2 max-w-[320px] md:max-w-[380px] max-h-[35vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in z-40 ${showControlsOnMobile ? \'flex\' : \'hidden md:flex\'}`}>'
)

# Bottom right
content = content.replace(
    '<div className="absolute bottom-24 right-4 md:bottom-28 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[300px] md:max-w-[340px] animate-fade-in">',
    '<div className={`absolute bottom-24 right-4 md:bottom-28 md:right-6 pointer-events-auto flex flex-col gap-2 max-w-[300px] md:max-w-[340px] max-h-[35vh] overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade-in z-40 ${showControlsOnMobile ? \'flex\' : \'hidden md:flex\'}`}>'
)

with open('src/ScientificHUD.tsx', 'w') as f:
    f.write(content)

