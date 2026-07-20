#!/usr/bin/env ruby

require 'xcodeproj'

# Load the Pods project
project = Xcodeproj::Project.open('Pods/Pods.xcodeproj')

# Find the fmt target
fmt_target = project.targets.find { |t| t.name == 'fmt' }

if fmt_target
  fmt_target.build_configurations.each do |config|
    # Add FMT_USE_CONSTEVAL=0 to preprocessor definitions
    defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || []
    defs = [defs] if defs.is_a?(String)
    defs = defs.compact + ['FMT_USE_CONSTEVAL=0']
    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs.uniq
    
    # Set C++ language standard to c++20
    config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
    
    puts "Updated #{config.name} configuration for fmt target"
  end
  
  project.save
  puts "Successfully updated Pods project with fmt compiler flags"
else
  puts "Warning: fmt target not found in Pods project"
end
