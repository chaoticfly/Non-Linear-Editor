package main

import (
	"archive/zip"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// createODT creates an ODT file from the compiled sections
func createODT(filePath string, sections []CompiledSection) error {
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	zipWriter := zip.NewWriter(file)

	// Write mimetype first (must be uncompressed and first in archive)
	mimetypeWriter, err := zipWriter.CreateHeader(&zip.FileHeader{
		Name:   "mimetype",
		Method: zip.Store, // No compression for mimetype
	})
	if err != nil {
		return err
	}
	if _, err := mimetypeWriter.Write([]byte("application/vnd.oasis.opendocument.text")); err != nil {
		return err
	}

	// Write META-INF/manifest.xml
	manifestWriter, err := zipWriter.Create("META-INF/manifest.xml")
	if err != nil {
		return err
	}
	if _, err := manifestWriter.Write([]byte(manifestXML)); err != nil {
		return err
	}

	// Write styles.xml
	stylesWriter, err := zipWriter.Create("styles.xml")
	if err != nil {
		return err
	}
	if _, err := stylesWriter.Write([]byte(generateStylesXML(sections))); err != nil {
		return err
	}

	// Write content.xml
	contentWriter, err := zipWriter.Create("content.xml")
	if err != nil {
		return err
	}
	contentXML := generateContentXML(sections)
	if _, err := contentWriter.Write([]byte(contentXML)); err != nil {
		return err
	}

	// Write meta.xml
	metaWriter, err := zipWriter.Create("meta.xml")
	if err != nil {
		return err
	}
	if _, err := metaWriter.Write([]byte(metaXML)); err != nil {
		return err
	}

	// Close the zip writer explicitly to flush all data
	return zipWriter.Close()
}

const manifestXML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
 <manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.text"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`

const metaXML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
 office:version="1.3">
 <office:meta>
  <meta:generator>Non-Linear Editor</meta:generator>
 </office:meta>
</office:document-meta>`

func generateStylesXML(sections []CompiledSection) string {
	styles := `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
 xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 office:version="1.3">
 <office:styles>
  <style:style style:name="Standard" style:family="paragraph" style:class="text">
   <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.5cm"/>
   <style:text-properties fo:font-size="12pt" fo:font-family="Liberation Serif"/>
  </style:style>
  <style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="0.8cm" fo:margin-bottom="0.3cm"/>
   <style:text-properties fo:font-size="14pt" fo:font-weight="bold"/>
  </style:style>
  <style:style style:name="CategoryHeading" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="1.2cm" fo:margin-bottom="0.4cm" fo:border-bottom="0.5pt solid #999999" fo:padding-bottom="0.2cm"/>
   <style:text-properties fo:font-size="16pt" fo:font-weight="bold" fo:color="#222222"/>
  </style:style>
  <style:style style:name="TagLine" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.3cm"/>
   <style:text-properties fo:font-size="9pt" fo:color="#666666" fo:font-style="italic"/>
  </style:style>
  <style:style style:name="Bold" style:family="text">
   <style:text-properties fo:font-weight="bold"/>
  </style:style>
  <style:style style:name="Italic" style:family="text">
   <style:text-properties fo:font-style="italic"/>
  </style:style>
`

	// Add colored heading styles for each section
	for i, section := range sections {
		styles += fmt.Sprintf(`  <style:style style:name="SectionHeading%d" style:family="paragraph" style:parent-style-name="Heading">
   <style:text-properties fo:color="%s"/>
  </style:style>
`, i, section.Color)
	}

	styles += ` </office:styles>
</office:document-styles>`

	return styles
}

func generateContentXML(sections []CompiledSection) string {
	content := `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
 office:version="1.3">
 <office:automatic-styles>
  <style:style style:name="P1" style:family="paragraph" style:parent-style-name="Standard"/>
  <style:style style:name="T1" style:family="text">
   <style:text-properties fo:font-weight="bold"/>
  </style:style>
  <style:style style:name="T2" style:family="text">
   <style:text-properties fo:font-style="italic"/>
  </style:style>
 </office:automatic-styles>
 <office:body>
  <office:text>
`

	// Build a section index map so we can look up the original style index
	sectionIndex := map[*CompiledSection]int{}
	for i := range sections {
		sectionIndex[&sections[i]] = i
	}

	groups := groupByCategory(sections)

	// Track the global section index for SectionHeading styles
	globalIdx := 0
	for _, group := range groups {
		// Emit category heading if category is non-empty
		if group.Name != "" {
			content += fmt.Sprintf("   <text:p text:style-name=\"CategoryHeading\">%s</text:p>\n", escapeXML(group.Name))
		}

		for _, section := range group.Sections {
			label := escapeXML(section.Label)
			if label == "" {
				label = "Untitled"
			}

			// Section heading with color
			content += fmt.Sprintf("   <text:p text:style-name=\"SectionHeading%d\">%s</text:p>\n", globalIdx, label)

			// Tags line
			if len(section.Tags) > 0 {
				tagLine := ""
				for j, tag := range section.Tags {
					if j > 0 {
						tagLine += "  ·  "
					}
					tagLine += escapeXML(tag)
				}
				content += fmt.Sprintf("   <text:p text:style-name=\"TagLine\">%s</text:p>\n", tagLine)
			}

			// Convert HTML content to ODT paragraphs
			odtContent := htmlToODT(section.Content)
			content += odtContent
			globalIdx++
		}
	}

	content += `  </office:text>
 </office:body>
</office:document-content>`

	return content
}

// htmlToODT converts HTML content from Quill to ODT XML
func htmlToODT(html string) string {
	if html == "" {
		return "   <text:p text:style-name=\"P1\"/>\n"
	}

	var result strings.Builder

	// Split by paragraphs
	// Handle <p> tags
	paragraphRe := regexp.MustCompile(`<p[^>]*>(.*?)</p>`)
	matches := paragraphRe.FindAllStringSubmatch(html, -1)

	if len(matches) == 0 {
		// No <p> tags, treat as single paragraph
		text := stripTags(html)
		if text != "" {
			result.WriteString(fmt.Sprintf("   <text:p text:style-name=\"P1\">%s</text:p>\n", escapeXML(text)))
		}
		return result.String()
	}

	for _, match := range matches {
		if len(match) > 1 {
			content := match[1]
			result.WriteString("   <text:p text:style-name=\"P1\">")
			result.WriteString(convertInlineHTML(content))
			result.WriteString("</text:p>\n")
		}
	}

	// Handle lists (basic support)
	ulRe := regexp.MustCompile(`<ul>(.*?)</ul>`)
	ulMatches := ulRe.FindAllStringSubmatch(html, -1)
	for _, match := range ulMatches {
		if len(match) > 1 {
			liRe := regexp.MustCompile(`<li>(.*?)</li>`)
			liMatches := liRe.FindAllStringSubmatch(match[1], -1)
			for _, li := range liMatches {
				if len(li) > 1 {
					result.WriteString(fmt.Sprintf("   <text:p text:style-name=\"P1\">• %s</text:p>\n", convertInlineHTML(li[1])))
				}
			}
		}
	}

	olRe := regexp.MustCompile(`<ol>(.*?)</ol>`)
	olMatches := olRe.FindAllStringSubmatch(html, -1)
	for _, match := range olMatches {
		if len(match) > 1 {
			liRe := regexp.MustCompile(`<li>(.*?)</li>`)
			liMatches := liRe.FindAllStringSubmatch(match[1], -1)
			for i, li := range liMatches {
				if len(li) > 1 {
					result.WriteString(fmt.Sprintf("   <text:p text:style-name=\"P1\">%d. %s</text:p>\n", i+1, convertInlineHTML(li[1])))
				}
			}
		}
	}

	if result.Len() == 0 {
		return "   <text:p text:style-name=\"P1\"/>\n"
	}

	return result.String()
}

// convertInlineHTML converts inline HTML elements to ODT text spans
func convertInlineHTML(html string) string {
	// First, decode common HTML entities
	result := decodeHTMLEntities(html)

	// Convert <strong> and <b> to bold spans (escape inner content)
	strongRe := regexp.MustCompile(`(?i)<(strong|b)>(.*?)</(strong|b)>`)
	result = strongRe.ReplaceAllStringFunc(result, func(match string) string {
		inner := strongRe.FindStringSubmatch(match)
		if len(inner) > 2 {
			text := stripTags(inner[2])
			return `<text:span text:style-name="T1">` + escapeXML(text) + `</text:span>`
		}
		return ""
	})

	// Convert <em> and <i> to italic spans (escape inner content)
	emRe := regexp.MustCompile(`(?i)<(em|i)>(.*?)</(em|i)>`)
	result = emRe.ReplaceAllStringFunc(result, func(match string) string {
		inner := emRe.FindStringSubmatch(match)
		if len(inner) > 2 {
			text := stripTags(inner[2])
			return `<text:span text:style-name="T2">` + escapeXML(text) + `</text:span>`
		}
		return ""
	})

	// Convert <u> to plain text (escape content)
	uRe := regexp.MustCompile(`(?i)<u>(.*?)</u>`)
	result = uRe.ReplaceAllStringFunc(result, func(match string) string {
		inner := uRe.FindStringSubmatch(match)
		if len(inner) > 1 {
			return escapeXML(stripTags(inner[1]))
		}
		return ""
	})

	// Strip any remaining HTML tags except text:span, then escape remaining text
	result = escapeTextOutsideSpans(stripTagsExceptSpan(result))

	return result
}

// decodeHTMLEntities decodes common HTML entities
func decodeHTMLEntities(s string) string {
	s = strings.ReplaceAll(s, "&nbsp;", " ")
	s = strings.ReplaceAll(s, "&lt;", "<")
	s = strings.ReplaceAll(s, "&gt;", ">")
	s = strings.ReplaceAll(s, "&amp;", "&")
	s = strings.ReplaceAll(s, "&quot;", "\"")
	s = strings.ReplaceAll(s, "&#39;", "'")
	return s
}

// escapeTextOutsideSpans escapes XML special chars in text that's not inside text:span tags
func escapeTextOutsideSpans(s string) string {
	// Split by text:span tags and escape text portions
	spanRe := regexp.MustCompile(`(<text:span[^>]*>.*?</text:span>)`)
	parts := spanRe.Split(s, -1)
	spans := spanRe.FindAllString(s, -1)

	var result strings.Builder
	for i, part := range parts {
		result.WriteString(escapeXML(part))
		if i < len(spans) {
			result.WriteString(spans[i])
		}
	}
	return result.String()
}

func stripTags(html string) string {
	re := regexp.MustCompile(`<[^>]*>`)
	return re.ReplaceAllString(html, "")
}

func stripTagsExceptSpan(html string) string {
	// Remove all tags except text:span
	re := regexp.MustCompile(`<(?!/?text:span)[^>]*>`)
	return re.ReplaceAllString(html, "")
}

func escapeXML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&apos;")
	return s
}
