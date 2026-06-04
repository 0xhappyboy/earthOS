export function generateId(prefix: string = ""): string {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

export function rgbaToArray(color: string): number[] {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return [255, 0, 0, 1];
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2], data[3] / 255];
}

export function arrayToRgba(color: number[]): string {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] ?? 1})`;
}