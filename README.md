# MEDIA MASTER - Ultimate Media Organizer Plus

MEDIA MASTER - Ultimate Media Organizer Plus is a powerful desktop application for organizing and managing your media files intelligently. It automatically organizes photos and videos into structured folders based on metadata and custom patterns.

## Features

- **Smart Media Organization**: Organize photos and videos into structured folders based on date, camera, type, and more
- **Metadata Analysis**: Extract and use EXIF data for better organization
- **Custom Patterns**: Create custom folder structures using flexible patterns
- **Duplicate Detection**: Avoid duplicates by detecting similar files
- **Batch Processing**: Process multiple files at once with parallel execution
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Advanced Options**: AI categorization, geo-tagging, face recognition, video processing, and more
- **Multi-language Support**: Available in English and Turkish

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/media-master.git
cd media-master
```

2. Install dependencies:
```bash
npm install
```

3. Start the application in development mode:
```bash
npm run dev
```

### Building from Source

To build the application for your platform:

```bash
npm run build
```

This will create distributable packages in the `out` directory.

## Usage

1. Launch the Media Master application
2. Select a source directory containing your media files
3. Choose a destination directory where you want your organized files
4. Configure organization options:
   - Choose between moving or copying files
   - Set folder pattern (e.g., Year/Month/Day)
   - Configure conflict resolution strategy
   - Enable advanced features as needed
5. Click "Start Organizing" to begin the process

## Organization Patterns

Media Master uses patterns to create folder structures. Some examples:

- `%Y/%m/%d` - Year/Month/Day folders (e.g., "2023/05/21")
- `%Y/%m` - Year/Month folders (e.g., "2023/05")
- `%Y/%m/%d/%H` - Year/Month/Day/Hour folders (e.g., "2023/05/21/15")
- `%e/%Y-%m-%d` - Event-based organization
- `%c/%Y/%m/%d` - Camera model, then date (e.g., "Canon EOS R5/2023/05/21")
- `%t/%Y/%m/%d` - File type, then date (e.g., "Photos/2023/05/21")

## Advanced Features

- **AI Categorization**: Categorize images by content using AI
- **Geo Tagging**: Organize by location when GPS data is available
- **Face Recognition**: Group photos by detected faces
- **Format Conversion**: Convert files from one format to another
- **Cloud Upload**: Upload organized files to cloud storage
- **Encryption**: Encrypt sensitive media with password protection
- **Web Interface**: Remote management via web browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.